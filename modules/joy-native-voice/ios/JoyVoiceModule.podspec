Pod::Spec.new do |s|
  s.name           = 'JoyVoiceModule'
  s.version        = '1.0.0'
  s.summary        = 'Native iOS speech recognition and synthesis for JOY'
  s.description    = 'On-device speech input and AVSpeechSynthesizer output using Apple frameworks.'
  s.license        = { :type => 'MIT' }
  s.author         = 'JOY'
  s.homepage       = 'https://localhost/joy'
  s.platforms      = { :ios => '15.0' }
  s.swift_version  = '5.9'
  s.source         = { :path => '.' }
  s.source_files   = '**/*.{h,m,mm,swift}'
  s.dependency 'ExpoModulesCore'
  s.frameworks = 'Speech', 'AVFoundation', 'EventKit', 'Contacts'
end
