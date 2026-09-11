export type Language = "en" | "hi";

export const dict = {
  en: {
    dashboard: "Dashboard",
    reportIssue: "Report Issue",
    transportLogin: "Transport / Login",
    blocked: "Blocked",
    atRisk: "At Risk",
    clear: "Clear",
    liveFeed: "Live Feed",
    latestReports: "Latest Reports",
    status: "Status",
    location: "Location",
    severity: "Severity",
    notes: "Notes",
    submit: "Submit",
    photoVerif: "Photo Verification",
    tapToPhoto: "Tap to Take Photo",
    home: "Home",
    sos: "SOS",
    track: "Track",
    profile: "Profile",
    statusClear: "Clear",
    statusAtRisk: "At Risk",
    statusBlocked: "Blocked"
  },
  hi: {
    dashboard: "डैशबोर्ड",
    reportIssue: "समस्या दर्ज करें",
    transportLogin: "परिवहन / लॉगिन",
    blocked: "अवरुद्ध",
    atRisk: "जोखिम में",
    clear: "साफ़",
    liveFeed: "लाइव फ़ीड",
    latestReports: "नवीनतम रिपोर्ट",
    status: "स्थिति",
    location: "स्थान",
    severity: "गंभीरता",
    notes: "नोट्स",
    submit: "जमा करें",
    photoVerif: "फोटो सत्यापन",
    tapToPhoto: "फोटो लेने के लिए टैप करें",
    home: "होम",
    sos: "एसओएस",
    track: "ट्रैक",
    profile: "प्रोफ़ाइल",
    statusClear: "साफ़",
    statusAtRisk: "जोखिम में",
    statusBlocked: "अवरुद्ध"
  }
};

export const t = (key: keyof typeof dict.en, lang: Language) => {
  return dict[lang][key] || dict["en"][key];
};
