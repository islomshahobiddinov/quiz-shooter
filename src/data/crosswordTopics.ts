export type WordEntry = { word: string; clue: string }

export type CrosswordTopic = {
  id: string
  title: string
  description: string
  words: WordEntry[]
}

export const crosswordTopics: CrosswordTopic[] = [
  {
    id: 'html',
    title: 'HTML',
    description: 'Veb sahifa tuzilmasi va teglar',
    words: [
      { word: 'ELEMENT',   clue: 'Ochiluvchi va yopiluvchi tegdan iborat HTML birligi' },
      { word: 'ATTRIBUTE', clue: 'Tegga qo\'shimcha ma\'lumot beruvchi xususiyat (masalan: class, id)' },
      { word: 'SEMANTIC',  clue: 'Ma\'noli teglar: <header>, <article>, <footer>' },
      { word: 'ANCHOR',    clue: 'Havola yaratuvchi <a> tegining nomi' },
      { word: 'CANVAS',    clue: 'JavaScript orqali grafika chizish uchun HTML elementi' },
      { word: 'SCRIPT',    clue: 'JavaScript kodni sahifaga qo\'shuvchi teg' },
      { word: 'SECTION',   clue: 'Sahifani mantiqiy qismlarga ajratuvchi semantik teg' },
      { word: 'TEMPLATE',  clue: 'Brauzer tomonidan ko\'rsatilmaydigan HTML qolip tegi' },
      { word: 'IFRAME',    clue: 'Boshqa sahifani hujjat ichiga joylashtiradigan teg' },
      { word: 'FORM',      clue: 'Foydalanuvchi ma\'lumotlarini to\'plash uchun teg' },
      { word: 'INPUT',     clue: 'Matn, parol yoki fayl kiritish uchun maydon' },
      { word: 'TABLE',     clue: 'Qator va ustunlarda ma\'lumot ko\'rsatuvchi element' },
    ],
  },
  {
    id: 'css',
    title: 'CSS',
    description: 'Uslublar va vizual dizayn',
    words: [
      { word: 'SELECTOR',   clue: 'Uslub qo\'llaniladigan elementni tanlash usuli' },
      { word: 'FLEXBOX',    clue: 'Elementlarni satr yoki ustunda joylashtirish modeli' },
      { word: 'GRADIENT',   clue: 'Bir rangdan ikkinchisiga silliq o\'tish effekti' },
      { word: 'ANIMATION',  clue: 'Keyframe asosida harakatlanuvchi CSS effekti' },
      { word: 'TRANSFORM',  clue: 'Elementni aylantirish, kattalashtirish yoki siljitish' },
      { word: 'POSITION',   clue: 'Elementni static, relative, absolute, fixed qilish' },
      { word: 'OVERFLOW',   clue: 'Toshgan kontentni yashirish yoki siljitish boshqaruvi' },
      { word: 'OPACITY',    clue: 'Elementning shaffoflik darajasi (0 dan 1 gacha)' },
      { word: 'MARGIN',     clue: 'Element atrofidagi tashqi bo\'sh joy' },
      { word: 'BORDER',     clue: 'Element atrofidagi chegara chizig\'i' },
      { word: 'DISPLAY',    clue: 'Elementning blok, inline yoki flex ko\'rsatilish turi' },
      { word: 'INHERIT',    clue: 'Qiymatni ota elementdan olish kalit so\'zi' },
    ],
  },
  {
    id: 'javascript',
    title: 'JavaScript',
    description: 'JS asosiy tushunchalari',
    words: [
      { word: 'PROMISE',   clue: 'Asinxron operatsiya natijasiga va\'da beruvchi ob\'ekt' },
      { word: 'CLOSURE',   clue: 'Tashqi o\'zgaruvchilarga kirish imkoniga ega funksiya' },
      { word: 'CALLBACK',  clue: 'Boshqa funksiyaga argument sifatida beriladigan funksiya' },
      { word: 'PROTOTYPE', clue: 'Ob\'ektning meros olish zanjiri' },
      { word: 'HOISTING',  clue: 'O\'zgaruvchi va funksiya e\'lonlarini yuqoriga ko\'tarish' },
      { word: 'SCOPE',     clue: 'O\'zgaruvchi ko\'rinishi mumkin bo\'lgan soha' },
      { word: 'EVENT',     clue: 'Foydalanuvchi yoki brauzer harakati (click, keydown)' },
      { word: 'FETCH',     clue: 'Serverdan ma\'lumot oluvchi Web API funksiyasi' },
      { word: 'SPREAD',    clue: 'Massiv yoki ob\'ektni yoyish operatori (...)' },
      { word: 'MODULE',    clue: 'Kodni alohida faylga bo\'lish va import/export mexanizmi' },
      { word: 'ASYNC',     clue: 'Kutmasdan davom etuvchi funksiyani belgilash kalit so\'zi' },
      { word: 'ITERATOR',  clue: 'Ketma-ket elementlarni aylanib chiquvchi ob\'ekt' },
    ],
  },
  {
    id: 'react',
    title: 'React',
    description: 'React kutubxonasi tushunchalari',
    words: [
      { word: 'COMPONENT', clue: 'Qayta ishlatiladigan UI qismi (funksiya yoki klass)' },
      { word: 'PROPS',     clue: 'Komponentga tashqaridan beriladigan o\'zgarmas ma\'lumotlar' },
      { word: 'STATE',     clue: 'Komponentning o\'zgaruvchan ichki holati' },
      { word: 'CONTEXT',   clue: 'Global holat uzatish mexanizmi (useContext)' },
      { word: 'REDUCER',   clue: 'Holatni action orqali yangilaydigan sof funksiya' },
      { word: 'HOOK',      clue: 'Funksional komponentda React xususiyatini ishlatish' },
      { word: 'RENDER',    clue: 'Komponentni Virtual DOM ga chiqarish jarayoni' },
      { word: 'PORTAL',    clue: 'Komponentni boshqa DOM tuguniga joylashtirish' },
      { word: 'EFFECT',    clue: 'useEffect ichida bajariladigan yon ta\'sir' },
      { word: 'FRAGMENT',  clue: 'Qo\'shimcha DOM elementi yaratmasdan guruhlashtirish (<>)' },
      { word: 'PROVIDER',  clue: 'Context qiymatini pastki komponentlarga uzatuvchi wrapper' },
      { word: 'MEMO',      clue: 'Komponentni keraksiz qayta render qilmaslik uchun HOC' },
    ],
  },
]
