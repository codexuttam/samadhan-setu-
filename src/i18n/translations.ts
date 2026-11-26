export type Lang = 'en' | 'hi';

export const CATEGORY_LABELS: Record<string, { en: { name: string; desc: string }; hi: { name: string; desc: string } }> = {
  roads_potholes: {
    en: { name: 'Roads & Potholes', desc: 'Roads, potholes, footpaths' },
    hi: { name: 'सड़कें और गड्ढे', desc: 'सड़क मरम्मत, गड्ढे और फुटपाथ' },
  },
  street_lights: {
    en: { name: 'Street Lights', desc: 'Non-working or damaged street lights' },
    hi: { name: 'स्ट्रीट लाइट्स', desc: 'खराब या बंद स्ट्रीट लाइट' },
  },
  water_drainage: {
    en: { name: 'Water & Drainage', desc: 'Water supply, drainage blockage, leaks' },
    hi: { name: 'पानी और जल निकासी', desc: 'पानी की सप्लाई, लीकेज, सीवर ओवरफ्लो' },
  },
  garbage_sanitation: {
    en: { name: 'Garbage & Sanitation', desc: 'Garbage collection, waste disposal issues' },
    hi: { name: 'कचरा और स्वच्छता', desc: 'कचरा उठाव और सार्वजनिक सफाई' },
  },
  public_safety: {
    en: { name: 'Public Safety', desc: 'Safety, encroachment, illegal activities' },
    hi: { name: 'सार्वजनिक सुरक्षा', desc: 'अतिक्रमण, सुरक्षा और खुले खतरे' },
  },
  other_issue: {
    en: { name: 'Other Issue', desc: 'Any other civic issue' },
    hi: { name: 'अन्य नागरिक मुद्दे', desc: 'कोई अन्य नगर निगम समस्या' },
  },
};

export const SUBCATEGORY_HI: Record<string, string> = {
  'Pothole Repair': 'गड्ढों की मरम्मत',
  'Footpath Damage': 'फुटपाथ क्षतिग्रस्त',
  'Speed Breaker Issue': 'स्पीड ब्रेकर समस्या',
  'Water Logging on Road': 'सड़क पर जलभराव',
  'Road Divider Damage': 'रोड डिवाइडर क्षतिग्रस्त',
  'Non-working Street Light': 'बंद स्ट्रीट लाइट',
  'Exposed Electrical Cables': 'खुले बिजली के तार',
  'Flickering Light': 'झिलमिलाती लाइट',
  'New Pole Requirement': 'नए बिजली खंभे की आवश्यकता',
  'Drainage Pipe Leakage': 'नाली/पाइप लीकेज',
  'Sewer Overflow': 'सीवर ओवरफ्लो',
  'Drinking Water Contamination': 'दूषित पेयजल',
  'No Water Supply': 'पानी की आपूर्ति बंद',
  'Open Manhole': 'खुला मेनहोल',
  'Garbage Pile-up': 'कचरे का ढेर',
  'Missed Collection Route': 'कचरा गाड़ी न आना',
  'Public Toilet Maintenance': 'सार्वजनिक शौचालय रखरखाव',
  'Debris Dumped in Public Space': 'सार्वजनिक स्थान पर मलबा',
  'Illegal Encroachment': 'अवैध अतिक्रमण',
  'Stray Animal Menace': 'आवारा पशुओं की समस्या',
  'Damaged Public Playground/Park': 'क्षतिग्रस्त पार्क/खेल मैदान',
  'Hazardous Trees/Branches': 'खतरनाक पेड़/टहनियाँ',
  'General Query': 'सामान्य पूछताछ',
  'Unlisted Complaint': 'अन्य शिकायत',
  'Noise Pollution': 'ध्वनि प्रदूषण',
  'Public Property Defacement': 'सार्वजनिक संपत्ति को नुकसान',
  General: 'सामान्य',
};

export const DEPARTMENT_HI: Record<string, string> = {
  dept_roads: 'सड़क एवं बुनियादी ढांचा विभाग',
  'Roads & Infrastructure': 'सड़क एवं बुनियादी ढांचा विभाग',
  dept_electrical: 'विद्युत एवं स्ट्रीट लाइट विभाग',
  'Electricity & Streetlights': 'विद्युत एवं स्ट्रीट लाइट विभाग',
  dept_water: 'जल आपूर्ति एवं सीवरेज विभाग',
  'Water Supply & Sewerage': 'जल आपूर्ति एवं सीवरेज विभाग',
  dept_sanitation: 'स्वच्छता एवं ठोस अपशिष्ट विभाग',
  'Sanitation & Solid Waste': 'स्वच्छता एवं ठोस अपशिष्ट विभाग',
  dept_safety: 'सार्वजनिक स्वास्थ्य एवं सुरक्षा विभाग',
  'Public Health & Safety': 'सार्वजनिक स्वास्थ्य एवं सुरक्षा विभाग',
  dept_general: 'सामान्य प्रशासन विभाग',
  'General Administration': 'सामान्य प्रशासन विभाग',
};

export const WARD_HI: Record<string, string> = {
  ward_5: 'वार्ड 5 - शिवाजी नगर',
  'Ward 5 - Shivaji Nagar': 'वार्ड 5 - शिवाजी नगर',
  ward_8: 'वार्ड 8 - राम नगर',
  'Ward 8 - Ram Nagar': 'वार्ड 8 - राम नगर',
  ward_12: 'वार्ड 12 - पार्वती नगर',
  'Ward 12 - Parvati Nagar': 'वार्ड 12 - पार्वती नगर',
  ward_14: 'वार्ड 14 - गोकुल नगर',
  'Ward 14 - Gokul Nagar': 'वार्ड 14 - गोकुल नगर',
};

export const PRIORITY_HI: Record<string, string> = {
  low: 'कम',
  medium: 'मध्यम',
  high: 'उच्च',
  critical: 'अति आवश्यक',
};

export const STATUS_HI: Record<string, string> = {
  Submitted: 'लंबित (दर्ज)',
  SUBMITTED: 'लंबित (दर्ज)',
  Assigned: 'अधिकारी को सौंपी गई',
  ASSIGNED: 'अधिकारी को सौंपी गई',
  ACCEPTED: 'स्वीकृत',
  INSPECTION: 'स्थल निरीक्षण',
  'In Progress': 'कार्य प्रगति पर',
  IN_PROGRESS: 'कार्य प्रगति पर',
  WORK_COMPLETED: 'कार्य पूर्ण',
  AWAITING_CITIZEN_VERIFICATION: 'नागरिक सत्यापन लंबित',
  Escalated: 'उच्च स्तर पर एस्केलेट',
  ESCALATED: 'उच्च स्तर पर एस्केलेट',
  REOPENED: 'पुनः खोली गई',
  Resolved: 'समाधान पूर्ण',
  RESOLVED: 'समाधान पूर्ण',
  Closed: 'बंद (सत्यापित)',
  CLOSED: 'बंद (सत्यापित)',
};

export const ROLE_HI: Record<string, string> = {
  system: 'सिस्टम',
  citizen: 'नागरिक',
  officer: 'फील्ड अधिकारी',
  dept_admin: 'विभाग प्रशासक',
  super_admin: 'सुपर एडमिन',
};

export function tCategoryName(id: string, lang: Lang, fallback?: string): string {
  const entry = CATEGORY_LABELS[id];
  if (entry) return entry[lang].name;
  return fallback || id;
}

export function tCategoryDesc(id: string, lang: Lang, fallback?: string): string {
  const entry = CATEGORY_LABELS[id];
  if (entry) return entry[lang].desc;
  return fallback || '';
}

export function tSubcategory(sub: string, lang: Lang): string {
  if (lang === 'en') return sub;
  return SUBCATEGORY_HI[sub] || sub;
}

export function tDepartment(idOrName: string, lang: Lang, fallback?: string): string {
  if (lang === 'en') return fallback || idOrName;
  return DEPARTMENT_HI[idOrName] || (fallback ? DEPARTMENT_HI[fallback] : undefined) || fallback || idOrName;
}

export function tWard(idOrName: string, lang: Lang, fallback?: string): string {
  if (lang === 'en') return fallback || idOrName;
  return WARD_HI[idOrName] || (fallback ? WARD_HI[fallback] : undefined) || fallback || idOrName;
}

export function tPriority(priority: string, lang: Lang): string {
  if (lang === 'en') return priority.toUpperCase();
  return PRIORITY_HI[priority.toLowerCase()] || priority;
}

export function tStatus(status: string, lang: Lang): string {
  if (lang === 'en') {
    return status === 'Submitted' ? 'Pending Routing' : status;
  }
  return STATUS_HI[status] || status;
}

export function tRole(role: string, lang: Lang): string {
  if (lang === 'en') return role.replace('_', ' ');
  return ROLE_HI[role] || role;
}
