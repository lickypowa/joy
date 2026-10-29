import AVFoundation
import EventKit
import CryptoKit
import Contacts
import ExpoModulesCore
import Speech

private final class JoySpeechSynthesizerDelegate: NSObject, AVSpeechSynthesizerDelegate {
  private let onFinished: () -> Void

  init(onFinished: @escaping () -> Void) {
    self.onFinished = onFinished
    super.init()
  }

  func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
    onFinished()
  }
}

public class JoyVoiceModule: Module {
  private let engine = AVAudioEngine()
  private let synthesizer = AVSpeechSynthesizer()
  private lazy var speechSynthesizerDelegate = JoySpeechSynthesizerDelegate { [weak self] in
    self?.sendEvent("onSpeechFinished", [:])
  }
  private let eventStore = EKEventStore()
  private var request: SFSpeechAudioBufferRecognitionRequest?
  private var task: SFSpeechRecognitionTask?
  private var tapInstalled = false
  private var lastAmplitudeEvent: TimeInterval = 0

  public func definition() -> ModuleDefinition {
    Name("JoyVoice")
    Events("onPartialResult", "onFinalResult", "onRecognitionError", "onSpeechFinished", "onAmplitude")

    AsyncFunction("requestPermissions") { () async -> [String: String] in
      let speech = await withCheckedContinuation { continuation in
        SFSpeechRecognizer.requestAuthorization { status in
          continuation.resume(returning: Self.permissionName(status))
        }
      }
      let microphone: String
      if #available(iOS 17.0, *) {
        microphone = await AVAudioApplication.requestRecordPermission() ? "granted" : "denied"
      } else {
        microphone = await withCheckedContinuation { continuation in
          AVAudioSession.sharedInstance().requestRecordPermission { granted in
            continuation.resume(returning: granted ? "granted" : "denied")
          }
        }
      }
      return ["speech": speech, "microphone": microphone]
    }

    AsyncFunction("startListening") { (localeIdentifier: String) throws in
      guard SFSpeechRecognizer.authorizationStatus() == .authorized else {
        throw NSError(domain: "JoyVoice", code: 1, userInfo: [NSLocalizedDescriptionKey: "Speech recognition permission has not been granted."])
      }
      guard AVAudioSession.sharedInstance().recordPermission == .granted else {
        throw NSError(domain: "JoyVoice", code: 2, userInfo: [NSLocalizedDescriptionKey: "Microphone permission has not been granted."])
      }
      guard let recognizer = SFSpeechRecognizer(locale: Locale(identifier: localeIdentifier)), recognizer.isAvailable else {
        throw NSError(domain: "JoyVoice", code: 3, userInfo: [NSLocalizedDescriptionKey: "Speech recognition is unavailable for this language right now."])
      }
      guard recognizer.supportsOnDeviceRecognition else {
        throw NSError(domain: "JoyVoice", code: 4, userInfo: [NSLocalizedDescriptionKey: "Questo dispositivo non supporta il riconoscimento vocale offline per la lingua selezionata."])
      }
      stopRecognition()
      let audioSession = AVAudioSession.sharedInstance()
      try audioSession.setCategory(.record, mode: .measurement, options: [.duckOthers])
      try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
      let speechRequest = SFSpeechAudioBufferRecognitionRequest()
      speechRequest.shouldReportPartialResults = true
      speechRequest.requiresOnDeviceRecognition = true
      request = speechRequest
      let input = engine.inputNode
      let format = input.outputFormat(forBus: 0)
      input.installTap(onBus: 0, bufferSize: 1024, format: format) { [weak self] buffer, _ in
        speechRequest.append(buffer)
        guard let samples=buffer.floatChannelData?.pointee else { return }
        let count=Int(buffer.frameLength)
        guard count>0 else { return }
        var squares: Float=0
        for index in 0..<count { squares += samples[index] * samples[index] }
        let rms=sqrt(squares/Float(count))
        let now=ProcessInfo.processInfo.systemUptime
        if now - (self?.lastAmplitudeEvent ?? 0) >= 0.08 {
          self?.lastAmplitudeEvent=now
          self?.sendEvent("onAmplitude", ["value": min(1, Double(rms*8))])
        }
      }
      tapInstalled = true
      engine.prepare()
      try engine.start()
      task = recognizer.recognitionTask(with: speechRequest) { [weak self] result, error in
        guard let self else { return }
        if let result {
          let text = result.bestTranscription.formattedString
          self.sendEvent(result.isFinal ? "onFinalResult" : "onPartialResult", ["text": text])
          if result.isFinal { self.stopRecognition() }
        }
        if let error {
          self.sendEvent("onRecognitionError", ["message": error.localizedDescription])
          self.stopRecognition()
        }
      }
    }

    AsyncFunction("stopListening") { self.stopRecognition() }

    AsyncFunction("speak") { (text: String, localeIdentifier: String, rate: Double) in
      self.synthesizer.stopSpeaking(at: .immediate)
      let utterance = AVSpeechUtterance(string: text)
      utterance.voice = AVSpeechSynthesisVoice(language: localeIdentifier)
      utterance.rate = Float(min(max(rate, 0.35), 0.6))
      self.synthesizer.delegate = self.speechSynthesizerDelegate
      self.synthesizer.speak(utterance)
    }

    AsyncFunction("stopSpeaking") { self.synthesizer.stopSpeaking(at: .immediate) }
    Function("getPreference") { (key: String) -> String in UserDefaults.standard.string(forKey: "joy.\(key)") ?? "" }
    Function("physicalMemoryBytes") { () -> Double in Double(ProcessInfo.processInfo.physicalMemory) }
    Function("setPreference") { (key: String, value: String) in UserDefaults.standard.set(value, forKey: "joy.\(key)") }
    AsyncFunction("verifyModel") { (fileUri: String, expectedHash: String) throws -> Bool in
      guard let url = URL(string: fileUri), url.isFileURL else { return false }
      let data = try Data(contentsOf: url, options: .mappedIfSafe)
      let digest = SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
      return digest.caseInsensitiveCompare(expectedHash) == .orderedSame
    }
    AsyncFunction("availableVoices") { () -> [[String: String]] in
      AVSpeechSynthesisVoice.speechVoices().filter { $0.language.hasPrefix("it") || $0.language.hasPrefix("en") }.map {
        ["identifier": $0.identifier, "name": $0.name, "language": $0.language]
      }
    }

    AsyncFunction("requestRemindersPermission") { () async throws -> Bool in
      if #available(iOS 17.0, *) { return try await self.eventStore.requestFullAccessToReminders() }
      return try await withCheckedThrowingContinuation { continuation in
        self.eventStore.requestAccess(to: .reminder) { granted, error in
          if let error { continuation.resume(throwing: error) } else { continuation.resume(returning: granted) }
        }
      }
    }

    AsyncFunction("createReminder") { (title: String, dueTimestamp: Double) async throws -> [String: String] in
      guard !title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
        throw NSError(domain: "JoyVoice", code: 10, userInfo: [NSLocalizedDescriptionKey: "Il promemoria non ha un titolo."])
      }
      let status = EKEventStore.authorizationStatus(for: .reminder)
      let hasAccess: Bool
      if #available(iOS 17.0, *) { hasAccess = status == .fullAccess || status == .authorized }
      else { hasAccess = status == .authorized }
      guard hasAccess else {
        throw NSError(domain: "JoyVoice", code: 11, userInfo: [NSLocalizedDescriptionKey: "Autorizzazione Promemoria non concessa."])
      }
      let dueDate = Date(timeIntervalSince1970: dueTimestamp)
      let predicate = self.eventStore.predicateForIncompleteReminders(withDueDateStarting: nil, ending: nil, calendars: nil)
      let existing: [EKReminder] = await withCheckedContinuation { continuation in
        self.eventStore.fetchReminders(matching: predicate) { reminders in continuation.resume(returning: reminders ?? []) }
      }
      if existing.contains(where: { $0.title.caseInsensitiveCompare(title) == .orderedSame && Calendar.current.isDate($0.dueDateComponents.flatMap { Calendar.current.date(from: $0) } ?? .distantPast, inSameDayAs: dueDate) }) {
        return ["status": "duplicate", "title": title]
      }
      let reminder = EKReminder(eventStore: self.eventStore)
      reminder.title = title
      reminder.calendar = self.eventStore.defaultCalendarForNewReminders()
      reminder.dueDateComponents = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: dueDate)
      try self.eventStore.save(reminder, commit: true)
      return ["status": "created", "title": title]
    }

    AsyncFunction("requestContactsPermission") { () async -> Bool in
      let store=CNContactStore()
      return (try? await store.requestAccess(for: .contacts)) ?? false
    }

    AsyncFunction("findContacts") { (query: String) throws -> [[String: String]] in
      let status=CNContactStore.authorizationStatus(for: .contacts)
      guard status == .authorized else { return [] }
      let store=CNContactStore()
      let keys:[CNKeyDescriptor]=[CNContactGivenNameKey as CNKeyDescriptor,CNContactFamilyNameKey as CNKeyDescriptor,CNContactPhoneNumbersKey as CNKeyDescriptor]
      let predicate=CNContact.predicateForContacts(matchingName: query)
      let contacts=try store.unifiedContacts(matching: predicate, keysToFetch: keys)
      return contacts.prefix(10).map { contact in
        ["givenName":contact.givenName,"familyName":contact.familyName,"phone":contact.phoneNumbers.first?.value.stringValue ?? ""]
      }
    }
  }

  private func stopRecognition() {
    if engine.isRunning { engine.stop() }
    if tapInstalled { engine.inputNode.removeTap(onBus: 0); tapInstalled = false }
    request?.endAudio()
    task?.cancel()
    task = nil
    request = nil
    try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
  }

  private static func permissionName(_ status: SFSpeechRecognizerAuthorizationStatus) -> String {
    switch status {
    case .authorized: return "granted"
    case .denied, .restricted: return "denied"
    case .notDetermined: return "undetermined"
    @unknown default: return "unknown"
    }
  }
}
