'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, User, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/language-context';

export default function DedicatedChatbotPage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getInitialMessage = (lang: string) => ({
    sender: 'bot' as const,
    text: lang === 'TE'
      ? 'నమస్కారం! నేను ప్రజాసేవక్, మీ మున్సిపల్ పౌర సేవల అసిస్టెంట్‌ని. ఈరోజు నేను మీకు ఎలా సహాయపడగలను?\n\nమీరు సమస్యను నమోదు చేయవచ్చు, పరిష్కార సమయాలు (SLA) తనిఖీ చేయవచ్చు, ఫిర్యాదు స్థితిని తెలుసుకోవచ్చు లేదా మున్సిపల్ సేవల గురించి అడగవచ్చు.'
      : 'Namaste! I am PrajaSevak, your Municipal Civic Assistant. How can I assist you with civic services today?\n\nYou can report an issue, check SLA resolution timelines, track an existing complaint, or ask about municipal department services.',
    time: 'Just now',
    quickReplies: lang === 'TE'
      ? ['కొత్త సమస్య నమోదు', 'లక్ష్య సమయాలు (SLA)', 'ఫిర్యాదు స్థితి', 'మున్సిపల్ విభాగాలు', 'అత్యవసర హెల్ప్‌లైన్']
      : ['Report New Issue', 'Check SLA Hours', 'Track Existing Complaint', 'Municipal Department Contacts', 'Emergency Helpline'],
  });

  const [messages, setMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string; time: string; quickReplies?: string[] }>>([
    getInitialMessage(language),
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Auto-scroll to newest message whenever messages or typing state updates
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Update initial message if conversation hasn't started yet when language changes
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length <= 1) {
        return [getInitialMessage(language)];
      }
      return prev;
    });
  }, [language]);

  const handleSend = async (queryText?: string) => {
    if (isTyping) return;
    const q = (queryText || inputText).trim();
    if (!q) return;

    // Handle direct navigation buttons if user clicks form/dashboard buttons
    const qLower = q.toLowerCase();
    if (qLower === 'go to report form' || qLower === 'ఫిర్యాదు నమోదు ఫారమ్' || qLower === 'open report form') {
      router.push('/citizen/report');
      return;
    }
    if (qLower === 'check my complaints' || qLower === 'నా ఫిర్యాదులు' || qLower === 'view complaints') {
      router.push('/citizen/complaints');
      return;
    }

    const userMsg = { sender: 'user' as const, text: q, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputText('');
    setIsTyping(true);

    try {
      const res = await fetch('http://localhost:5000/api/chatbot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, language }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: data.response || 'PrajaSevak AI response',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            quickReplies: data.quickReplies && data.quickReplies.length > 0 ? data.quickReplies : undefined,
          },
        ]);
        setIsTyping(false);
        return;
      }
    } catch (err) {
      console.warn('Backend chatbot API error, falling back to local handler:', err);
    }

    // Deterministic fallback if backend is unreachable
    setTimeout(() => {
      const isTe = language === 'TE' || /[\u0C00-\u0C7F]/.test(q);
      let botResponse = '';
      let quickReplies: string[] | undefined = undefined;

      if (qLower.includes('sla') || qLower.includes('time') || qLower.includes('hours') || qLower.includes('సమయం') || qLower.includes('గంటలు')) {
        botResponse = isTe
          ? 'మున్సిపల్ విభాగాల ప్రామాణిక పరిష్కార లక్ష్య సమయాలు (SLA):\n• రోడ్లు & ఇంజనీరింగ్ (Roads & Asphalt) — 48 గంటలు\n• తాగునీటి సరఫరా (Water Supply) — 24 గంటలు\n• పారిశుధ్యం & ఆరోగ్యం (Sanitation & Health) — 24 గంటలు\n• వీధి దీపాలు (Street Lighting) — 12 గంటలు\n\nసమస్య తీవ్రతను బట్టి పరిష్కార సమయం మారవచ్చు.'
          : 'Here are the current expected service timelines (SLAs) for municipal departments:\n• Roads & Asphalt — 48 hours\n• Water Supply — 24 hours\n• Sanitation & Health — 24 hours\n• Street Lighting — 12 hours\n\nThe actual resolution time may vary depending on the severity and nature of the complaint.';
        quickReplies = isTe ? ['కొత్త సమస్య నమోదు', 'ఫిర్యాదు స్థితి', 'మున్సిపల్ విభాగాలు'] : ['Report New Issue', 'Track Existing Complaint', 'Municipal Department Contacts'];
      } else if (qLower.includes('track') || qLower.includes('status') || qLower.includes('స్థితి') || qLower.includes('ట్రాక్')) {
        botResponse = isTe
          ? 'ఖచ్చితంగా. దయచేసి మీ ఫిర్యాదు సంఖ్యను నమోదు చేయండి, నేను దాని ప్రస్తుత స్థితిని తనిఖీ చేస్తాను.'
          : 'Sure. Please enter your Complaint ID, and I can help you check its current status.';
        quickReplies = isTe ? ['నా ఫిర్యాదులు', 'కొత్త సమస్య నమోదు', 'అత్యవసర హెల్ప్‌లైన్'] : ['Check My Complaints', 'Report New Issue', 'Emergency Helpline'];
      } else if (qLower.includes('emergency') || qLower.includes('helpline') || qLower.includes('అత్యవసర') || qLower.includes('హెల్ప్‌లైన్')) {
        botResponse = isTe
          ? 'అత్యవసర సేవల కోసం సంప్రదించండి:\n• 112 — జాతీయ అత్యవసర హెల్ప్‌లైన్\n• 100 — పోలీస్\n• 101 — అగ్నిమాపక సేవలు\n• 108 — వైద్య అంబులెన్స్ సేవలు'
          : 'For urgent emergencies, contact the appropriate emergency service (112 / 100 / 101 / 108). For civic grievances, you can submit an urgent report on this portal.';
        quickReplies = isTe ? ['కొత్త సమస్య నమోదు', 'లక్ష్య సమయాలు (SLA)', 'మున్సిపల్ విభాగాలు'] : ['Report New Issue', 'Check SLA Hours', 'Municipal Department Contacts'];
      } else if (qLower.includes('contact') || qLower.includes('department') || qLower.includes('విభాగ') || qLower.includes('పరిచయ')) {
        botResponse = isTe
          ? 'మున్సిపల్ విభాగాలు మరియు అవి పరిష్కరించే సమస్యల వివరాలు:\n\n• రోడ్లు & ఇంజనీరింగ్ — రోడ్ల గుంతలు, పాడైన ఫుట్‌పాత్‌లు\n• తాగునీటి సరఫరా — పైప్‌లైన్ లీకేజీలు, నీటి కొరత\n• పారిశుధ్యం & ఆరోగ్యం — చెత్త నిల్వలు, మురుగు కాలువలు\n• వీధి దీపాలు — వెలగని వీధి దీపాలు, విద్యుత్ స్తంభాలు'
          : 'I can help you identify the concerned municipal department for your issue:\n\n• Roads & Asphalt — Road damage, potholes, and broken footpaths\n• Water Supply — Water supply and leakage issues\n• Sanitation & Health — Garbage, sanitation and drainage issues\n• Street Lighting — Streetlight and electrical civic issues';
        quickReplies = isTe ? ['కొత్త సమస్య నమోదు', 'లక్ష్య సమయాలు (SLA)', 'అత్యవసర హెల్ప్‌లైన్'] : ['Report New Issue', 'Check SLA Hours', 'Emergency Helpline'];
      } else if (qLower.includes('report') || qLower.includes('file') || qLower.includes('new issue') || qLower.includes('ఫిర్యాదు') || qLower.includes('నమోదు')) {
        botResponse = isTe
          ? 'కొత్త పౌర సమస్యను నమోదు చేయడానికి, ప్రభావిత మున్సిపల్ విభాగాన్ని ఎంచుకుని, సమస్యను వివరించి, ఫోటో అందుబాటులో ఉంటే అప్‌లోడ్ చేసి, ఖచ్చితమైన లొకేషన్‌తో సమర్పించండి.'
          : 'To report a new civic issue, select the affected department/category, describe the issue, upload a photo if available, and allow location detection so the complaint can be submitted with its location.';
        quickReplies = isTe ? ['ఫిర్యాదు నమోదు ఫారమ్', 'లక్ష్య సమయాలు (SLA)', 'మున్సిపల్ విభాగాలు'] : ['Go to Report Form', 'Check SLA Hours', 'Municipal Department Contacts'];
      } else {
        botResponse = isTe
          ? 'నమస్కారం! నేను ప్రజాసేవక్, మీ మున్సిపల్ పౌర సేవల అసిస్టెంట్‌ని. ఈరోజు నేను మీకు ఎలా సహాయపడగలను?'
          : 'Namaste! I am PrajaSevak, your Municipal Civic Assistant. How can I assist you with civic services today?';
        quickReplies = isTe
          ? ['కొత్త సమస్య నమోదు', 'లక్ష్య సమయాలు (SLA)', 'ఫిర్యాదు స్థితి', 'మున్సిపల్ విభాగాలు', 'అత్యవసర హెల్ప్‌లైన్']
          : ['Report New Issue', 'Check SLA Hours', 'Track Existing Complaint', 'Municipal Department Contacts', 'Emergency Helpline'];
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: botResponse,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          quickReplies,
        },
      ]);
      setIsTyping(false);
    }, 400);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col h-[75vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-gov-darkNavy via-gov-navy to-gov-deep text-white p-4 sm:p-6 border-b-4 border-gov-gold flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gov-gold text-slate-950 flex items-center justify-center font-extrabold shadow">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold flex items-center gap-2">
                {t('chatbot.pageTitle', 'PrajaSevak AI Assistant')}
                <Sparkles className="w-5 h-5 text-gov-gold" />
              </h1>
              <p className="text-blue-100 text-xs">{t('chatbot.pageSubtitle', 'Official Civic Intelligence Assistant • Municipal Administration & Urban Development')}</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50 text-xs sm:text-sm">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                {m.sender === 'bot' ? <Bot className="w-4 h-4 text-gov-navy" /> : <User className="w-4 h-4 text-slate-600" />}
                <span>{m.sender === 'bot' ? t('chatbot.botName', 'PrajaSevak AI') : t('chatbot.you', 'You')}</span>
                <span>• {m.time}</span>
              </div>
              <div
                className={`p-4 rounded-2xl max-w-[80%] whitespace-pre-line leading-relaxed shadow-sm ${
                  m.sender === 'user' ? 'bg-gov-navy text-white rounded-tr-none font-medium' : 'bg-white text-slate-900 border border-slate-200 rounded-tl-none font-medium'
                }`}
              >
                {m.text}
              </div>

              {m.quickReplies && (
                <div className="flex flex-wrap gap-2 mt-3 max-w-[85%]">
                  {m.quickReplies.map((qr, qidx) => (
                    <button
                      key={qidx}
                      onClick={() => handleSend(qr)}
                      disabled={isTyping}
                      className={`bg-blue-50 hover:bg-blue-100 text-gov-navy font-bold px-3 py-1.5 rounded-full border border-blue-200 text-xs transition-colors flex items-center gap-1 ${
                        isTyping ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    >
                      {qr} <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-slate-400 text-xs italic">
              <Bot className="w-4 h-4 text-gov-navy animate-bounce" />
              <span>{t('chatbot.typingIndicator', 'PrajaSevak AI is formulating response...')}</span>
            </div>
          )}

          {/* Messages End Ref Anchor for Auto-Scrolling */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-slate-200 flex gap-3">
          <input
            type="text"
            placeholder={t('chatbot.inputPlaceholder', 'Type your civic question or complaint details...')}
            value={inputText}
            disabled={isTyping}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-slate-100 border border-slate-300 rounded-xl px-4 py-3 text-xs sm:text-sm focus:outline-none focus:border-gov-navy text-slate-900 font-medium disabled:opacity-60"
          />
          <button
            onClick={() => handleSend()}
            disabled={isTyping || !inputText.trim()}
            className="bg-gov-navy hover:bg-blue-800 disabled:opacity-50 text-white font-bold px-5 py-3 rounded-xl shadow transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm"
          >
            <Send className="w-4 h-4" /> {t('chatbot.sendBtn', 'Send')}
          </button>
        </div>
      </div>
    </div>
  );
}
