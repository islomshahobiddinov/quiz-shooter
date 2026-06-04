export type MemoryPair = { term: string; hint: string }

export type MemoryTopic = {
  id: string
  title: string
  description: string
  pairs: MemoryPair[]
}

export const memoryTopics: MemoryTopic[] = [
  {
    id: 'html',
    title: 'HTML',
    description: 'Teglar va atributlar',
    pairs: [
      { term: 'DOCTYPE',   hint: 'HTML tur e\'loni' },
      { term: 'ELEMENT',   hint: 'Ochiluvchi + yopiluvchi teg' },
      { term: 'ATTRIBUTE', hint: 'class, id, src...' },
      { term: 'SEMANTIC',  hint: 'header, nav, article' },
      { term: 'ANCHOR',    hint: '<a> havola tegi' },
      { term: 'CANVAS',    hint: 'JS grafika maydoni' },
      { term: 'SCRIPT',    hint: 'JS kodni bog\'laydi' },
      { term: 'SECTION',   hint: 'Mantiqiy bo\'lim' },
      { term: 'TEMPLATE',  hint: 'Ko\'rinmas qolip' },
      { term: 'IFRAME',    hint: 'Sahifa ichida sahifa' },
      { term: 'FORM',      hint: 'Ma\'lumot to\'playdi' },
      { term: 'DETAILS',   hint: 'Yig\'iladigan kontent' },
    ],
  },
  {
    id: 'css',
    title: 'CSS',
    description: 'Uslublar va effektlar',
    pairs: [
      { term: 'SELECTOR',   hint: 'Element tanlash usuli' },
      { term: 'FLEXBOX',    hint: 'Moslashuvchan joylash' },
      { term: 'GRADIENT',   hint: 'Rang o\'tish effekti' },
      { term: 'ANIMATION',  hint: 'Keyframe harakati' },
      { term: 'TRANSFORM',  hint: 'Aylan, kattalashtir' },
      { term: 'POSITION',   hint: 'static/relative/absolute' },
      { term: 'OVERFLOW',   hint: 'Toshgan kontent' },
      { term: 'TRANSITION', hint: 'Silliq o\'tish effekti' },
      { term: 'GRID',       hint: '2D joylash modeli' },
      { term: 'INHERIT',    hint: 'Ota elementdan olish' },
      { term: 'PSEUDO',     hint: ':hover, :focus holati' },
      { term: 'OPACITY',    hint: 'Shaffoflik darajasi' },
    ],
  },
  {
    id: 'javascript',
    title: 'JavaScript',
    description: 'JS asosiy tushunchalari',
    pairs: [
      { term: 'PROMISE',   hint: 'Asinxron va\'da ob\'ekt' },
      { term: 'CLOSURE',   hint: 'Ichki funksiya + tashqi' },
      { term: 'CALLBACK',  hint: 'Argument funksiya' },
      { term: 'PROTOTYPE', hint: 'Meros zanjiri' },
      { term: 'HOISTING',  hint: 'E\'lonni yuqoriga ko\'tar' },
      { term: 'SCOPE',     hint: 'O\'zgaruvchi ko\'rinish doirasi' },
      { term: 'ASYNC',     hint: 'Kutmasdan davom et' },
      { term: 'FETCH',     hint: 'HTTP so\'rov API' },
      { term: 'SPREAD',    hint: '... yoyish operatori' },
      { term: 'MODULE',    hint: 'import/export fayl' },
      { term: 'SYMBOL',    hint: 'Noyob identifikator' },
      { term: 'ITERATOR',  hint: 'next() ketma-ket' },
    ],
  },
  {
    id: 'react',
    title: 'React',
    description: 'Komponentlar va hooklar',
    pairs: [
      { term: 'COMPONENT', hint: 'Qayta foydalanish UI' },
      { term: 'PROPS',     hint: 'Tashqaridan ma\'lumot' },
      { term: 'STATE',     hint: 'Ichki holat' },
      { term: 'CONTEXT',   hint: 'Global holat uzatish' },
      { term: 'REDUCER',   hint: 'Action → yangi holat' },
      { term: 'HOOK',      hint: 'Funksional xususiyat' },
      { term: 'RENDER',    hint: 'DOM ga chizish' },
      { term: 'PORTAL',    hint: 'Boshqa DOM tugun' },
      { term: 'EFFECT',    hint: 'Yon ta\'sir' },
      { term: 'FRAGMENT',  hint: '<> guruhlash' },
      { term: 'MEMO',      hint: 'Qayta render oldini ol' },
      { term: 'SUSPENSE',  hint: 'Yuklash kutish wrapper' },
    ],
  },
]
