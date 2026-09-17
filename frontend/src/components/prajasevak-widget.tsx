'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/language-context';

export default function PrajaSevakWidget() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getInitialMessage = (lang: string) => ({
    sender: 'bot' as const,
    text: lang === 'TE'
      ? 'నమస్కారం! నేను ప్రజాసేవక్, మీ మున్సిపల్ పౌర సేవల అసిస్టెంట్‌ని. ఈరోజు నేను మీకు ఎలా సహాయపడగలను?'
      : 'Namaste! I am PrajaSevak, your Municipal Civic Assistant. How can I assist you with civic services today?',
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

  // Auto-scroll to newest message whenever messages, typing indicator, or open state changes
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => scrollToBottom('auto'), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Sync initial message with language change if conversation hasn't expanded
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length <= 1) {
        return [getInitialMessage(language)];
      }
      return prev;
    });
  }, [language]);

  const handleSend = async (textToSend?: string) => {
    if (isTyping) return;
    const query = (textToSend || inputText).trim();
    if (!query) return;

    // Handle direct navigation actions if requested
    const qLower = query.toLowerCase();
    if (
      qLower === 'go to report form' ||
      qLower === 'open report form' ||
      qLower === 'ఫిర్యాదు నమోదు ఫారమ్'
    ) {
      router.push('/citizen/report');
      return;
    } else if (
      qLower === 'check my complaints' ||
      qLower === 'view complaints' ||
      qLower === 'నా ఫిర్యాదులు'
    ) {
      router.push('/citizen/complaints');
      return;
    }

    const userMsg = { sender: 'user' as const, text: query, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chatbot/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, language }),
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
      console.warn('Backend chatbot API error in widget, falling back to local handler:', err);
    }

    setTimeout(() => {
      const isTe = language === 'TE' || /[\u0C00-\u0C7F]/.test(query);
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
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gov-gold hover:bg-amber-400 text-slate-950 p-4 rounded-full shadow-2xl flex items-center gap-3 border-2 border-white transform hover:scale-105 transition-all group"
        >
          <div className="relative">
            <Bot className="w-7 h-7 text-slate-950" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white animate-pulse" />
          </div>
          <span className="font-extrabold text-sm hidden sm:inline pr-1">{t('chatbot.botName', 'PrajaSevak AI')}</span>
        </button>
      )}

      {isOpen && (
        <div className="bg-white w-[90vw] sm:w-[380px] h-[520px] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-gradient-to-r from-gov-darkNavy via-gov-navy to-gov-deep text-white px-4 py-3 flex justify-between items-center border-b border-blue-900/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gov-gold text-slate-950 flex items-center justify-center font-bold">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-sm flex items-center gap-1.5">
                  {t('chatbot.assistantTitle', 'PrajaSevak AI Chatbot')}
                  <Sparkles className="w-3.5 h-3.5 text-gov-gold" />
                </div>
                <div className="text-[10px] text-blue-200">{t('chatbot.assistantDesc', 'Municipal Civic Governance Assistant')}</div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-slate-300 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 text-xs">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1">
                  {m.sender === 'bot' ? <Bot className="w-3 h-3 text-gov-navy" /> : <User className="w-3 h-3 text-slate-600" />}
                  <span>{m.sender === 'bot' ? t('chatbot.botName', 'PrajaSevak AI') : t('chatbot.you', 'You')}</span>
                  <span>• {m.time}</span>
                </div>
                <div
                  className={`p-3 rounded-xl max-w-[85%] whitespace-pre-line leading-relaxed shadow-sm ${
                    m.sender === 'user' ? 'bg-gov-navy text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                  }`}
                >
                  {m.text}
                </div>

                {m.quickReplies && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                    {m.quickReplies.map((qr, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(qr)}
                        disabled={isTyping}
                        className={`bg-blue-50 hover:bg-blue-100 text-gov-navy font-semibold px-2.5 py-1 rounded-full border border-blue-200 text-[10px] transition-colors flex items-center gap-1 ${
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
              <div className="flex items-center gap-2 text-slate-400 text-[11px] italic">
                <Bot className="w-3.5 h-3.5 text-gov-navy animate-bounce" />
                <span>{t('chatbot.typingIndicator', 'PrajaSevak AI is formulating response...')}</span>
              </div>
            )}

            {/* Messages End Ref Anchor for Auto-Scrolling */}
            <div ref={messagesEndRef} />
          </div>

          {/* Input form */}
          <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
            <input
              type="text"
              placeholder={t('chatbot.widgetPlaceholder', 'Ask PrajaSevak AI or type complaint status...')}
              value={inputText}
              disabled={isTyping}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-gov-navy text-slate-800 disabled:opacity-60"
            />
            <button
              onClick={() => handleSend()}
              disabled={isTyping || !inputText.trim()}
              className="bg-gov-navy hover:bg-blue-800 disabled:opacity-50 text-white p-2 rounded-lg transition-colors flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
