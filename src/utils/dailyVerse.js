/** Curated NIV verses. Rotates daily by day-of-year. */
const VERSES = [
  { ref: 'John 3:16',          text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.' },
  { ref: 'Jeremiah 29:11',     text: '"For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, plans to give you hope and a future."' },
  { ref: 'Philippians 4:13',   text: 'I can do all this through him who gives me strength.' },
  { ref: 'Romans 8:28',        text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.' },
  { ref: 'Proverbs 3:5–6',     text: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.' },
  { ref: 'Isaiah 40:31',       text: 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.' },
  { ref: 'Psalm 23:1',         text: 'The Lord is my shepherd, I lack nothing.' },
  { ref: 'Matthew 6:33',       text: 'But seek first his kingdom and his righteousness, and all these things will be given to you as well.' },
  { ref: 'Psalm 46:1',         text: 'God is our refuge and strength, an ever-present help in trouble.' },
  { ref: 'Romans 12:2',        text: 'Do not conform to the pattern of this world, but be transformed by the renewing of your mind. Then you will be able to test and approve what God\'s will is — his good, pleasing and perfect will.' },
  { ref: 'Galatians 2:20',     text: 'I have been crucified with Christ and I no longer live, but Christ lives in me. The life I now live in the body, I live by faith in the Son of God, who loved me and gave himself for me.' },
  { ref: '2 Corinthians 5:17', text: 'Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!' },
  { ref: 'Ephesians 2:8–9',    text: 'For it is by grace you have been saved, through faith — and this is not from yourselves, it is the gift of God — not by works, so that no one can boast.' },
  { ref: 'Philippians 4:6–7',  text: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.' },
  { ref: 'Matthew 11:28',      text: '"Come to me, all you who are weary and burdened, and I will give you rest."' },
  { ref: 'John 14:6',          text: 'Jesus answered, "I am the way and the truth and the life. No one comes to the Father except through me."' },
  { ref: 'Hebrews 11:1',       text: 'Now faith is confidence in what we hope for and assurance about what we do not see.' },
  { ref: 'James 1:2–3',        text: 'Consider it pure joy, my brothers and sisters, whenever you face trials of many kinds, because you know that the testing of your faith produces perseverance.' },
  { ref: '1 John 1:9',         text: 'If we confess our sins, he is faithful and just and will forgive us our sins and purify us from all unrighteousness.' },
  { ref: 'Psalm 119:105',      text: 'Your word is a lamp for my feet, a light on my path.' },
  { ref: 'Isaiah 41:10',       text: 'So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.' },
  { ref: 'Romans 8:38–39',     text: 'For I am convinced that neither death nor life, neither angels nor demons, neither the present nor the future, nor any powers, neither height nor depth, nor anything else in all creation, will be able to separate us from the love of God that is in Christ Jesus our Lord.' },
  { ref: '2 Timothy 3:16–17',  text: 'All Scripture is God-breathed and is useful for teaching, rebuking, correcting and training in righteousness, so that the servant of God may be thoroughly equipped for every good work.' },
  { ref: 'Revelation 21:4',    text: '"He will wipe every tear from their eyes. There will be no more death" or mourning or crying or pain, for the old order of things has passed away.' },
  { ref: 'Psalm 27:1',         text: 'The Lord is my light and my salvation — whom shall I fear? The Lord is the stronghold of my life — of whom shall I be afraid?' },
  { ref: 'Matthew 5:16',       text: 'In the same way, let your light shine before others, that they may see your good deeds and glorify your Father in heaven.' },
  { ref: 'Colossians 3:23',    text: 'Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.' },
  { ref: '1 Corinthians 13:4–5', text: 'Love is patient, love is kind. It does not envy, it does not boast, it is not proud. It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs.' },
  { ref: 'Joshua 1:9',         text: '"Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go."' },
  { ref: 'Psalm 46:10',        text: '"Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth."' },
];

/** Returns today's verse, rotating daily. */
export function getDailyVerse(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date - start) / 86_400_000);
  return VERSES[dayOfYear % VERSES.length];
}
