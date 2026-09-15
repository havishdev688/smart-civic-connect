'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'EN' | 'TE';

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  EN: {
    // Top Bar & Navbar
    'nav.topHeading': 'Municipal Administration & Urban Development',
    'nav.prajasevak': 'PrajaSevak AI Chatbot',
    'nav.brandTitle': 'SMART CIVIC CONNECT',
    'nav.brandSubtitle': 'Citizen Grievance Redressal Portal',
    'nav.home': 'Home',
    'nav.services': 'Services',
    'nav.departments': 'Departments',
    'nav.howItWorks': 'How It Works',
    'nav.dashboard': 'Dashboard',
    'nav.reportIssue': 'Report Issue',
    'nav.officerPortal': 'Officer Portal',
    'nav.adminPortal': 'Admin Portal',
    'nav.login': 'Login',
    'nav.register': 'Register Citizen',
    'nav.logout': 'Logout',
    'nav.switchLang': 'English / తెలుగు',
    'nav.citizenDashboard': 'Citizen Dashboard',
    'nav.officerDashboard': 'Officer Dashboard',
    'nav.adminDashboard': 'Admin Dashboard',

    // Home Page Hero
    'home.heroTitle1': 'Smart Civic Connect',
    'home.heroTitle2': 'Grievance Redressal System',
    'home.heroDesc': 'Report potholes, water leakages, streetlight failures, or sanitation issues directly to municipal departments. Our AI engine automatically classifies department, sets resolution SLA, and dispatches field officers.',
    'home.reportNow': 'Report Civic Grievance Now',
    'home.trackStatus': 'Track Complaint Status',

    // Services Section
    'home.servicesBadge': 'Civic Redressal Categories',
    'home.servicesHeading': 'Key Municipal Services Supported',
    'home.servicesSub': 'Smart Civic Connect handles all urban municipal complaints with enforced time-bound SLAs.',
    'dept.roads': 'Roads & Asphalt',
    'dept.roadsDesc': 'Potholes, broken tar, pavement damage & footpath repairs.',
    'dept.water': 'Water Supply',
    'dept.waterDesc': 'Pipeline bursts, contaminated water & emergency tanker requests.',
    'dept.sanitation': 'Sanitation & Health',
    'dept.sanitationDesc': 'Garbage dump clearing, street sweeping & vector control.',
    'dept.lighting': 'Street Lighting',
    'dept.lightingDesc': 'Dark streets, non-functional LED poles & loose wiring.',
    'sla.target': 'Target SLA',
    'sla.hours': 'Hours',

    // How it Works
    'howItWorks.badge': 'Transparent Process',
    'howItWorks.heading': 'How Grievances are Resolved',
    'howItWorks.step1Title': 'Report Grievance',
    'howItWorks.step1Desc': 'Citizen uploads photo, title & enables GPS location.',
    'howItWorks.step2Title': 'AI Routing & SLA',
    'howItWorks.step2Desc': 'AI auto-assigns department, priority & checks for duplicates.',
    'howItWorks.step3Title': 'Officer Action',
    'howItWorks.step3Desc': 'Department officer reviews, dispatches team & resolves issue.',
    'howItWorks.step4Title': 'Verification & Feedback',
    'howItWorks.step4Desc': 'Officer uploads photo proof. Citizen rates satisfaction.',

    // PrajaSevak Banner
    'chatbot.bannerBadge': 'PrajaSevak AI',
    'chatbot.bannerTitle': 'Need Help Lodging a Complaint?',
    'chatbot.bannerDesc': 'Chat with PrajaSevak, our official AI assistant available in English and Telugu to help you navigate civic services.',
    'chatbot.launchBtn': 'Launch Chatbot',

    // Chatbot UI & Messages
    'chatbot.pageTitle': 'PrajaSevak AI Assistant',
    'chatbot.pageSubtitle': 'Official Civic Intelligence Assistant • Municipal Administration & Urban Development',
    'chatbot.welcomeMsg': 'Namaste! Welcome to PrajaSevak AI, your official Municipal Civic Assistant.\n\nHow can I help you today? You can report an issue, check SLA resolution timelines, or ask about local municipal services.',
    'chatbot.widgetWelcome': 'Namaste! I am PrajaSevak, your Municipal Civic Assistant. How can I assist you with civic services today?',
    'chatbot.inputPlaceholder': 'Type your civic question or complaint details...',
    'chatbot.widgetPlaceholder': 'Ask PrajaSevak AI or type complaint status...',
    'chatbot.sendBtn': 'Send',
    'chatbot.typingIndicator': 'PrajaSevak AI is formulating response...',
    'chatbot.you': 'You',
    'chatbot.botName': 'PrajaSevak AI',
    'chatbot.assistantTitle': 'PrajaSevak AI',
    'chatbot.assistantDesc': 'Municipal Civic Assistant',
    'chatbot.qr.report': 'Report New Issue',
    'chatbot.qr.sla': 'Check SLA Hours',
    'chatbot.qr.helpline': 'Emergency Helpline',
    'chatbot.qr.track': 'Track Complaint Status',

    // Grievance Report Page
    'report.wizard': 'Citizen Service Wizard',
    'report.title': 'Report a Civic Grievance',
    'report.subtitle': 'Provide issue details and photo evidence. AI automatically assigns the responsible department.',
    'report.authRequiredTitle': 'Citizen Login Required',
    'report.authRequiredDesc': 'Please log in as a citizen to lodge and track your civic complaints.',
    'report.loginToContinue': 'Log In to Continue',
    'report.grievanceTitle': 'Grievance Title *',
    'report.titlePlaceholder': 'e.g., Deep pothole near signal causing traffic risk',
    'report.photoEvidence': 'Complaint Photo Evidence',
    'report.takePhoto': 'Take Photo',
    'report.openCamera': 'Open device camera',
    'report.uploadPhoto': 'Upload Photo',
    'report.fromStorage': 'From phone/PC storage',
    'report.replacePhoto': 'Replace Photo',
    'report.removePhoto': 'Remove',
    'report.detailedDesc': 'Detailed Description *',
    'report.descPlaceholder': 'Describe the issue size, hazard level, and exact location markers...',
    'report.generateAi': 'Generate Description with AI',
    'report.analyzingImage': 'Analyzing Image...',
    'report.location': 'Location & Address *',
    'report.autoGps': 'Auto Detect GPS',
    'report.detectingGps': 'Detecting GPS...',
    'report.landmarkPlaceholder': 'Nearby Landmark (optional)',
    'report.submit': 'Submit Grievance to Municipal Department',
    'report.submitting': 'Lodging Grievance...',
    'report.aiSidebarTitle': 'Department Routing',
    'report.aiDept': 'Department:',
    'report.priority': 'Priority Tag',
    'report.targetSla': 'Target SLA',
    'report.imageEvidence': 'Image Evidence',
    'report.uploaded': 'Uploaded ✓',
    'report.notUploaded': 'Not uploaded',
    'report.locationSidebar': 'Location',
    'report.waitingDetails': 'Waiting for complaint details',
    'report.analyzingDetails': 'Analyzing complaint details...',
    'report.unclassified': 'Classification unavailable',
    'report.confidence': 'Confidence Score:',
    'report.successTitle': 'Grievance Lodged Successfully!',
    'report.complaintNoPrefix': 'Your complaint reference number is',
    'report.goToDashboard': 'Go to Citizen Dashboard',
    'report.reportAnother': 'Report Another Issue',

    // Dashboard
    'dashboard.portalBadge': 'Citizen Grievance Portal',
    'dashboard.welcome': 'Namaste',
    'dashboard.subtitle': 'Track active grievances or submit new civic issues for automatic AI department routing.',
    'dashboard.reportNew': 'Report New Grievance',
    'dashboard.totalComplaints': 'Total Complaints Filed',
    'dashboard.totalSub': 'Lifetime grievances registered',
    'dashboard.activeComplaints': 'Active & In-Progress',
    'dashboard.activeSub': 'Currently assigned to field teams',
    'dashboard.resolvedComplaints': 'Resolved Grievances',
    'dashboard.resolvedSub': 'Completed with work verification',
    'dashboard.recentNotifs': 'Recent Grievance Notifications',
    'dashboard.viewAll': 'View All',
    'dashboard.recentGrievances': 'Your Recent Grievances',
    'dashboard.recentSub': 'Real-time status updates and department assignments',
    'dashboard.noComplaints': 'No grievances filed yet.',
    'dashboard.noComplaintsSub': 'You have not submitted any complaints.',
    'dashboard.slaHelp': 'Need help understanding resolution SLAs?',
    'dashboard.slaHelpDesc': 'PrajaSevak AI can answer questions about municipal timelines, officer assignments, or escalation.',
    'dashboard.askPrajaSevak': 'Ask PrajaSevak AI →',

    // Notifications Page
    'notif.title': 'Grievance Alerts & Notifications',
    'notif.subtitle': 'Real-time status updates and department notifications from PostgreSQL database.',
    'notif.emptyTitle': 'No notifications yet',
    'notif.emptyDesc': 'You will receive alerts here whenever your grievances are lodged, assigned, or updated by municipal officers.',

    // Authentication
    'auth.loginTitle': 'Smart Civic Connect Login',
    'auth.loginSubtitle': 'Official Portal Login • Municipal Administration & Urban Development',
    'auth.citizenTab': 'Citizen',
    'auth.officerTab': 'Officer',
    'auth.adminTab': 'Admin',
    'auth.citizenEmailMobile': 'Email Address or Mobile Number',
    'auth.officialEmail': 'Official Email Address',
    'auth.password': 'Password',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.loginBtn': 'Login as',
    'auth.authenticating': 'Authenticating...',
    'auth.continueGoogle': 'Continue with Google',
    'auth.loginMobileOtp': 'Login with Mobile OTP',
    'auth.newCitizen': 'New citizen? Register here',
    'auth.registerTitle': 'Citizen Registration',
    'auth.registerSubtitle': 'Create your Smart Civic Connect account with Mobile OTP verification',
    'auth.fullName': 'Full Name (as in Aadhaar/Voter ID) *',
    'auth.mobileNumber': 'Mobile Number (for OTP verification) *',
    'auth.emailAddress': 'Email Address *',
    'auth.enterOtp': 'Enter 6-Digit Mobile Verification OTP *',
    'auth.sendOtpBtn': 'Send Verification OTP',
    'auth.verifyRegisterBtn': 'Verify OTP & Complete Registration',
    'auth.resendOtp': 'Resend OTP',
    'auth.alreadyRegistered': 'Already registered? Login here',

    // Footer
    'footer.quickNav': 'Quick Navigation',
    'footer.home': 'Home Portal',
    'footer.report': 'Report Civic Grievance',
    'footer.track': 'Track Complaint Status',
    'footer.assistant': 'PrajaSevak AI Assistant',
    'footer.officerLogin': 'Department Officer Login',
    'footer.departments': 'Municipal Departments',
    'footer.support': 'Emergency & Support',
    'footer.helpline': 'Emergency Services:',
    'footer.deptName': 'SCC Support Team',
    'footer.copyright': '© 2026 Municipal Administration & Urban Development. Smart Civic Connect (SCC) Platform. All rights reserved.',
  },
  TE: {
    // Top Bar & Navbar
    'nav.topHeading': 'పురపాలక పరిపాలన & పట్టణాభివృద్ధి',
    'nav.prajasevak': 'ప్రజాసేవక్ AI చాట్‌బాట్',
    'nav.brandTitle': 'స్మార్ట్ సివిక్ కనెక్ట్',
    'nav.brandSubtitle': 'పౌర సమస్యల పరిష్కార వేదిక',
    'nav.home': 'హోమ్',
    'nav.services': 'సేవలు',
    'nav.departments': 'విభాగాలు',
    'nav.howItWorks': 'పనితీరు విధానం',
    'nav.dashboard': 'డ్యాష్‌బోర్డ్',
    'nav.reportIssue': 'సమస్య నమోదు',
    'nav.officerPortal': 'అధికారుల పోర్టల్',
    'nav.adminPortal': 'అడ్మిన్ పోర్టల్',
    'nav.login': 'లాగిన్',
    'nav.register': 'పౌరుల నమోదు',
    'nav.logout': 'లాగౌట్',
    'nav.switchLang': 'English / తెలుగు',
    'nav.citizenDashboard': 'పౌరుల డ్యాష్‌బోర్డ్',
    'nav.officerDashboard': 'అధికారుల డ్యాష్‌బోర్డ్',
    'nav.adminDashboard': 'అడ్మిన్ డ్యాష్‌బోర్డ్',

    // Home Page Hero
    'home.heroTitle1': 'స్మార్ట్ సివిక్ కనెక్ట్',
    'home.heroTitle2': 'ప్రజా సమస్యల పరిష్కార వేదిక',
    'home.heroDesc': 'రోడ్ల గుంతలు, నీటి లీకేజీలు, వీధి దీపాల సమస్యలు, పారిశుధ్య సమస్యలను నేరుగా మున్సిపల్ శాఖలకు నివేదించండి. మా AI ఇంజిన్ స్వయంచాలకంగా విభాగాన్ని వర్గీకరిస్తుంది, పరిష్కార సమయాన్ని నిర్దేశిస్తుంది మరియు అధికారులను నియమిస్తుంది.',
    'home.reportNow': 'ఇప్పుడే సమస్యను నమోదు చేయండి',
    'home.trackStatus': 'ఫిర్యాదు స్థితిని తనిఖీ చేయండి',

    // Services Section
    'home.servicesBadge': 'పౌర పరిష్కార విభాగాలు',
    'home.servicesHeading': 'ముఖ్య మున్సిపల్ సేవలు',
    'home.servicesSub': 'స్మార్ట్ సివిక్ కనెక్ట్ నిర్ణీత సమయ పరిమితులలో అన్ని పట్టణ మున్సిపల్ ఫిర్యాదులను పరిష్కరిస్తుంది.',
    'dept.roads': 'రోడ్లు & తారు',
    'dept.roadsDesc': 'గుంతలు, దెబ్బతిన్న రోడ్లు, పేవ్‌మెంట్ నష్టం మరియు ఫుట్‌పాత్ మరమ్మతులు.',
    'dept.water': 'తాగునీటి సరఫరా',
    'dept.waterDesc': 'పైప్‌లైన్ లీకేజీలు, కలుషిత నీరు మరియు అత్యవసర ట్యాంకర్ అభ్యర్థనలు.',
    'dept.sanitation': 'పారిశుధ్యం & ఆరోగ్యం',
    'dept.sanitationDesc': 'చెత్త డంప్ క్లియరింగ్, వీధుల ఊడ్చివేత మరియు దోమల నివారణ.',
    'dept.lighting': 'వీధి దీపాలు',
    'dept.lightingDesc': 'చీకటి వీధులు, వెలగని LED స్తంభాలు మరియు వదులుగా ఉన్న వైరింగ్.',
    'sla.target': 'లక్ష్య సమయం',
    'sla.hours': 'గంటలు',

    // How it Works
    'howItWorks.badge': 'పారదర్శక విధానం',
    'howItWorks.heading': 'సమస్యలు ఎలా పరిష్కరించబడతాయి',
    'howItWorks.step1Title': 'ఫిర్యాదు నమోదు',
    'howItWorks.step1Desc': 'పౌరులు ఫోటో, శీర్షిక మరియు GPS స్థానాన్ని అందిస్తారు.',
    'howItWorks.step2Title': 'AI వర్గీకరణ & కాలపరిమితి',
    'howItWorks.step2Desc': 'AI విభాగాన్ని, ప్రాధాన్యతను స్వయంచాలకంగా కేటాయిస్తుంది.',
    'howItWorks.step3Title': 'అధికారుల చర్య',
    'howItWorks.step3Desc': 'విభాగపు అధికారి పరిశీలించి, సిబ్బందిని పంపి పరిష్కరిస్తారు.',
    'howItWorks.step4Title': 'ధృవీకరణ & ఫీడ్‌బ్యాక్',
    'howItWorks.step4Desc': 'అధికారి ఫోటో సాక్ష్యాన్ని అప్‌లోడ్ చేస్తారు. పౌరులు రేటింగ్ ఇస్తారు.',

    // PrajaSevak Banner
    'chatbot.bannerBadge': 'ప్రజాసేవక్ AI',
    'chatbot.bannerTitle': 'ఫిర్యాదు నమోదులో సహాయం కావాలా?',
    'chatbot.bannerDesc': 'మున్సిపల్ సేవలను సులభంగా పొందడానికి ఇంగ్లీష్ మరియు తెలుగులో అందుబాటులో ఉన్న మా అధికారిక AI అసిస్టెంట్ ప్రజాసేవక్‌తో మాట్లాడండి.',
    'chatbot.launchBtn': 'చాట్‌బాట్ ప్రారంభించండి',

    // Chatbot UI & Messages
    'chatbot.pageTitle': 'ప్రజాసేవక్ AI అసిస్టెంట్',
    'chatbot.pageSubtitle': 'అధికారిక పౌర సేవల AI అసిస్టెంట్ • పురపాలక పరిపాలన & పట్టణాభివృద్ధి',
    'chatbot.welcomeMsg': 'నమస్కారం! అధికారిక పౌర పాలన AI అసిస్టెంట్ ప్రజాసేవక్ కు స్వాగతం.\n\nనేను మీకు ఎలా సహాయపడగలను? మీరు సమస్యను నమోదు చేయవచ్చు, పరిష్కార సమయాలను తనిఖీ చేయవచ్చు లేదా స్థానిక మున్సిపల్ సేవల గురించి అడగవచ్చు.',
    'chatbot.widgetWelcome': 'నమస్కారం! నేను ప్రజాసేవక్, మీ మున్సిపల్ పౌర సేవల అసిస్టెంట్‌ని. ఈరోజు నేను మీకు ఎలా సహాయపడగలను?',
    'chatbot.inputPlaceholder': 'మీ పౌర ప్రశ్న లేదా సమస్య వివరాలను టైప్ చేయండి...',
    'chatbot.widgetPlaceholder': 'ప్రజాసేవక్ AI ని అడగండి లేదా ఫిర్యాదు స్థితి టైప్ చేయండి...',
    'chatbot.sendBtn': 'పంపండి',
    'chatbot.typingIndicator': 'ప్రజాసేవక్ AI సమాధానాన్ని రూపొందిస్తోంది...',
    'chatbot.you': 'మీరు',
    'chatbot.botName': 'ప్రజాసేవక్ AI',
    'chatbot.assistantTitle': 'ప్రజాసేవక్ AI',
    'chatbot.assistantDesc': 'మున్సిపల్ పౌర సేవల అసిస్టెంట్',
    'chatbot.qr.report': 'కొత్త సమస్య నమోదు',
    'chatbot.qr.sla': 'లక్ష్య సమయాలు (SLA)',
    'chatbot.qr.helpline': 'అత్యవసర హెల్ప్‌లైన్',
    'chatbot.qr.track': 'ఫిర్యాదు స్థితి',

    // Grievance Report Page
    'report.wizard': 'పౌర సేవల విభాగం',
    'report.title': 'పౌర సమస్యను నమోదు చేయండి',
    'report.subtitle': 'సమస్య వివరాలు మరియు ఫోటో సాక్ష్యం అందించండి. AI స్వయంచాలకంగా సంబంధిత విభాగానికి కేటాయిస్తుంది.',
    'report.authRequiredTitle': 'పౌరుల లాగిన్ అవసరం',
    'report.authRequiredDesc': 'మీ పౌర ఫిర్యాదులను నమోదు చేయడానికి మరియు ట్రాక్ చేయడానికి దయచేసి పౌరుడిగా లాగిన్ అవ్వండి.',
    'report.loginToContinue': 'కొనసాగడానికి లాగిన్ అవ్వండి',
    'report.grievanceTitle': 'సమస్య శీర్షిక *',
    'report.titlePlaceholder': 'ఉదా: ట్రాఫిక్ ప్రమాదానికి కారణమవుతున్న రోడ్డు గుంత',
    'report.photoEvidence': 'ఫిర్యాదు ఫోటో సాక్ష్యం',
    'report.takePhoto': 'ఫోటో తీయండి',
    'report.openCamera': 'కెమెరా తెరవండి',
    'report.uploadPhoto': 'ఫోటో అప్‌లోడ్ చేయండి',
    'report.fromStorage': 'స్టోరేజ్ నుండి ఎంచుకోండి',
    'report.replacePhoto': 'ఫోటో మార్చండి',
    'report.removePhoto': 'తొలగించండి',
    'report.detailedDesc': 'వివరణాత్మక వివరణ *',
    'report.descPlaceholder': 'సమస్య తీవ్రత, ప్రమాద స్థాయి మరియు ఖచ్చితమైన ప్రదేశాన్ని వివరించండి...',
    'report.generateAi': 'AIతో వివరణను రూపొందించండి',
    'report.analyzingImage': 'చిత్రాన్ని విశ్లేషిస్తోంది...',
    'report.location': 'స్థలం & చిరునామా *',
    'report.autoGps': 'GPS స్వయంచాలకంగా గుర్తించండి',
    'report.detectingGps': 'GPS గుర్తిస్తోంది...',
    'report.landmarkPlaceholder': 'సమీప ల్యాండ్‌మార్క్ (ఐచ్ఛికం)',
    'report.submit': 'మున్సిపల్ విభాగానికి సమర్పించండి',
    'report.submitting': 'సమర్పిస్తోంది...',
    'report.aiSidebarTitle': 'విభాగ కేటాయింపు',
    'report.aiDept': 'విభాగం:',
    'report.priority': 'ప్రాధాన్యత',
    'report.targetSla': 'లక్ష్య సమయం',
    'report.imageEvidence': 'చిత్ర సాక్ష్యం',
    'report.uploaded': 'అప్‌లోడ్ చేయబడింది ✓',
    'report.notUploaded': 'అప్‌లోడ్ చేయలేదు',
    'report.locationSidebar': 'స్థానం',
    'report.waitingDetails': 'సమస్య వివరాల కోసం వేచి ఉంది',
    'report.analyzingDetails': 'వివరాలను విశ్లేషిస్తోంది...',
    'report.unclassified': 'వర్గీకరణ అందుబాటులో లేదు',
    'report.confidence': 'విశ్వసనీయత స్కోరు:',
    'report.successTitle': 'ఫిర్యాదు విజయవంతంగా నమోదైంది!',
    'report.complaintNoPrefix': 'మీ ఫిర్యాదు సూచన సంఖ్య',
    'report.goToDashboard': 'పౌరుల డ్యాష్‌బోర్డ్‌కు వెళ్లండి',
    'report.reportAnother': 'మరొక సమస్యను నమోదు చేయండి',

    // Dashboard
    'dashboard.portalBadge': 'పౌర సమస్యల పోర్టల్',
    'dashboard.welcome': 'నమస్కారం',
    'dashboard.subtitle': 'నమోదైన సమస్యలను ట్రాక్ చేయండి లేదా కొత్త సమస్యలను నమోదు చేయండి.',
    'dashboard.reportNew': 'కొత్త సమస్యను నమోదు చేయండి',
    'dashboard.totalComplaints': 'మొత్తం నమోదైన ఫిర్యాదులు',
    'dashboard.totalSub': 'ఇప్పటివరకు నమోదైన మొత్తం ఫిర్యాదులు',
    'dashboard.activeComplaints': 'ప్రస్తుతం పరిష్కారంలో ఉన్నవి',
    'dashboard.activeSub': 'ఫీల్డ్ బృందాలకు కేటాయించబడినవి',
    'dashboard.resolvedComplaints': 'పరిష్కరించబడిన సమస్యలు',
    'dashboard.resolvedSub': 'ధృవీకరణతో పూర్తయినవి',
    'dashboard.recentNotifs': 'ఇటీవలి నోటిఫికేషన్లు',
    'dashboard.viewAll': 'అన్నీ చూడండి',
    'dashboard.recentGrievances': 'మీ ఇటీవలి ఫిర్యాదులు',
    'dashboard.recentSub': 'నిజ సమయ స్థితి నవీకరణలు మరియు విభాగ కేటాయింపులు',
    'dashboard.noComplaints': 'ఇంకా ఎలాంటి ఫిర్యాదులు నమోదు కాలేదు.',
    'dashboard.noComplaintsSub': 'మీరు ఇంకా ఎలాంటి ఫిర్యాదులను సమర్పించలేదు.',
    'dashboard.slaHelp': 'పరిష్కార సమయాల గురించి సహాయం కావాలా?',
    'dashboard.slaHelpDesc': 'మున్సిపల్ కాలపరిమితులు, అధికారుల కేటాయింపులపై ప్రజాసేవక్ సమాధానమిస్తుంది.',
    'dashboard.askPrajaSevak': 'ప్రజాసేవక్ AI ని అడగండి →',

    // Notifications Page
    'notif.title': 'సమస్యల హెచ్చరికలు & నోటిఫికేషన్లు',
    'notif.subtitle': 'PostgreSQL డేటాబేస్ నుండి నిజ సమయ నవీకరణలు మరియు నోటిఫికేషన్లు.',
    'notif.emptyTitle': 'ఇంకా ఎలాంటి నోటిఫికేషన్లు లేవు',
    'notif.emptyDesc': 'మీ ఫిర్యాదులు నమోదు చేయబడినప్పుడు లేదా అధికారులు నవీకరించినప్పుడు ఇక్కడ నోటిఫికేషన్లు కనిపిస్తాయి.',

    // Authentication
    'auth.loginTitle': 'స్మార్ట్ సివిక్ కనెక్ట్ లాగిన్',
    'auth.loginSubtitle': 'అధికారిక పోర్టల్ లాగిన్ • పురపాలక పరిపాలన & పట్టణాభివృద్ధి',
    'auth.citizenTab': 'పౌరుడు',
    'auth.officerTab': 'అధికారి',
    'auth.adminTab': 'అడ్మిన్',
    'auth.citizenEmailMobile': 'ఈమెయిల్ లేదా మొబైల్ నంబర్',
    'auth.officialEmail': 'అధికారిక ఈమెయిల్ చిరునామా',
    'auth.password': 'పాస్‌వర్డ్',
    'auth.forgotPassword': 'పాస్‌వర్డ్ మర్చిపోయారా?',
    'auth.loginBtn': 'లాగిన్ అవ్వండి',
    'auth.authenticating': 'ధృవీకరిస్తోంది...',
    'auth.continueGoogle': 'Google తో కొనసాగించండి',
    'auth.loginMobileOtp': 'మొబైల్ OTP తో లాగిన్ అవ్వండి',
    'auth.newCitizen': 'కొత్త పౌరులా? ఇక్కడ నమోదు చేసుకోండి',
    'auth.registerTitle': 'పౌరుల నమోదు',
    'auth.registerSubtitle': 'మొబైల్ OTP ధృవీకరణతో మీ ఖాతాను సృష్టించండి',
    'auth.fullName': 'పూర్తి పేరు (ఆధార్/ఓటర్ ఐడీ ప్రకారం) *',
    'auth.mobileNumber': 'మొబైల్ నంబర్ (OTP ధృవీకరణ కోసం) *',
    'auth.emailAddress': 'ఈమెయిల్ చిరునామా *',
    'auth.enterOtp': '6-అంకెల మొబైల్ ధృవీకరణ OTP ని నమోదు చేయండి *',
    'auth.sendOtpBtn': 'ధృవీకరణ OTP పంపండి',
    'auth.verifyRegisterBtn': 'OTP ధృవీకరించి నమోదు పూర్తి చేయండి',
    'auth.resendOtp': 'OTP మళ్లీ పంపండి',
    'auth.alreadyRegistered': 'ఇప్పటికే ఖాతా ఉందా? ఇక్కడ లాగిన్ అవ్వండి',

    // Footer
    'footer.quickNav': 'త్వరిత నావిగేషన్',
    'footer.home': 'హోమ్ పోర్టల్',
    'footer.report': 'పౌర సమస్య నమోదు',
    'footer.track': 'ఫిర్యాదు స్థితి తనిఖీ',
    'footer.assistant': 'ప్రజాసేవక్ AI అసిస్టెంట్',
    'footer.officerLogin': 'శాఖ అధికారి లాగిన్',
    'footer.departments': 'మున్సిపల్ విభాగాలు',
    'footer.support': 'అత్యవసర & సహాయం',
    'footer.helpline': 'అత్యవసర హెల్ప్‌లైన్:',
    'footer.deptName': 'పురపాలక పరిపాలన & పట్టణాభివృద్ధి శాఖ',
    'footer.copyright': '© 2026 పురపాలక పరిపాలన & పట్టణాభివృద్ధి. స్మార్ట్ సివిక్ కనెక్ట్ (SCC) వేదిక. సర్వహక్కులు ప్రత్యేకించబడినవి.',
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'EN',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('EN');

  useEffect(() => {
    const saved = localStorage.getItem('scc_lang') as Language;
    if (saved === 'TE' || saved === 'EN') {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('scc_lang', lang);
  };

  const toggleLanguage = () => {
    const nextLang = language === 'EN' ? 'TE' : 'EN';
    setLanguage(nextLang);
  };

  const t = (key: string, fallback?: string): string => {
    const dict = TRANSLATIONS[language];
    if (dict && dict[key]) {
      return dict[key];
    }
    const enDict = TRANSLATIONS['EN'];
    if (enDict && enDict[key]) {
      return enDict[key];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
