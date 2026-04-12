import { useState } from 'react';

const instructions = {
  en: [
    'Create or join a match by selecting kill type, choosing an entry fee, and clicking FIND MATCH.',
    'Complete payment in the match lobby by uploading proof. After proof is verified by admin, the match creator gets the room credential section. Fill it and upload so your opponent can copy, paste, and join your custom room.',
    'After the match, take a screenshot of your win and submit result proof on the Result page. The system/admin will approve the winner and process payout automatically.',
    'If the card turns red in Pairing -> My Matches, it means someone has accepted your match. You will also get a notification in the 3-line menu -> Inbox.',
    'Add your Free Fire UID on the Profile page so your match record is complete.',
  ],
  hi: [
    'किल टाइप चुनें, एंट्री फ़ी चुनें, और FIND MATCH पर क्लिक करके मैच बनाएं या ज्वाइन करें।',
    'मैच लॉबी में भुगतान पूरा करें और प्रूफ अपलोड करें। प्रूफ को एडमिन वेरिफाई करने के बाद मैच बनाने वाले को रूम क्रेडेंशियल सेक्शन मिलेगा। उसे भरें और अपलोड करें ताकि आपका ओपोनेंट कॉपी-पेस्ट करके आपके कस्टम रूम में जुड़ सके।',
    'मैच के बाद जीत का स्क्रीनशॉट लें और Result पेज पर रिज़ल्ट प्रूफ सबमिट करें। सिस्टम/एडमिन विजेता को अप्रूव करेगा और पेआउट ऑटोमैटिकली प्रोसेस करेगा।',
    'जब Pairing -> My Matches सेक्शन में कार्ड लाल हो जाए, इसका मतलब है किसी ने आपका मैच एक्सेप्ट कर लिया है। आपको 3-लाइन मेन्यू -> Inbox में भी नोटिफिकेशन मिलेगा।',
    'प्रोफाइल पेज में अपना Free Fire UID जोड़ें।',
  ],
};

export const InstructionsScreen = () => {
  const [language, setLanguage] = useState('en');

  return (
    <div className="min-h-screen bg-[#0B0B0B] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-3xl border border-[#1F1F1F] bg-[#111111] p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">How to use Clutch Zone</h1>
            <p className="mt-2 text-sm text-[#A1A1A1]">Choose your language below.</p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className={`rounded-2xl px-4 py-2 text-sm font-semibold ${language === 'en' ? 'bg-[#FF6A00] text-black' : 'border border-[#2A2A2A] text-white'}`}
              onClick={() => setLanguage('en')}
            >
              English
            </button>
            <button
              type="button"
              className={`rounded-2xl px-4 py-2 text-sm font-semibold ${language === 'hi' ? 'bg-[#FF6A00] text-black' : 'border border-[#2A2A2A] text-white'}`}
              onClick={() => setLanguage('hi')}
            >
              हिंदी
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-4 text-sm text-[#D3D3D3]">
          {instructions[language].map((step, index) => (
            <p key={index}>{`${index + 1}. ${step}`}</p>
          ))}
        </div>
      </div>
    </div>
  );
};
