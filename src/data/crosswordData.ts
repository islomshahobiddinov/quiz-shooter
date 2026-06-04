export type Direction = 'across' | 'down'

export type CrosswordWord = {
  id: number
  word: string
  clue: string
  startRow: number
  startCol: number
  direction: Direction
}

export const GRID_ROWS = 11
export const GRID_COLS = 11

// Verified 11×11 grid — all intersections checked:
// (0,1)B (2,8)T (3,1)L (3,2)A (4,2)R (4,5)U (4,8)I (7,5)T (9,5)O
export const crosswordWords: CrosswordWord[] = [
  {
    id: 1, direction: 'across', startRow: 0, startCol: 0,
    word: 'OBJECT',
    clue: "OOP da ma'lumot va metodlarni birlashtirgan birlik",
  },
  {
    id: 2, direction: 'down', startRow: 0, startCol: 1,
    word: 'BOOLEAN',
    clue: 'true yoki false qiymat qabul qiluvchi ma\'lumot turi',
  },
  {
    id: 3, direction: 'down', startRow: 1, startCol: 8,
    word: 'STRING',
    clue: 'Matn yoki belgilar ketma-ketligi',
  },
  {
    id: 4, direction: 'across', startRow: 2, startCol: 5,
    word: 'SYNTAX',
    clue: 'Dasturlash tilining yozilish qoidalari',
  },
  {
    id: 5, direction: 'across', startRow: 3, startCol: 0,
    word: 'CLASS',
    clue: "Ob'ektlar uchun shablon (OOP)",
  },
  {
    id: 6, direction: 'down', startRow: 3, startCol: 2,
    word: 'ARRAY',
    clue: "Indeks orqali murojaat qilinadigan elementlar ro'yxati",
  },
  {
    id: 7, direction: 'down', startRow: 3, startCol: 5,
    word: 'FUNCTION',
    clue: 'Qayta ishlatiladigan, nomlangan kod bloki',
  },
  {
    id: 8, direction: 'across', startRow: 4, startCol: 2,
    word: 'RECURSION',
    clue: "Funksiyaning o'zini o'zi chaqirish texnikasi",
  },
  {
    id: 9, direction: 'across', startRow: 7, startCol: 4,
    word: 'STACK',
    clue: "LIFO tartibida ishlaydigan ma'lumotlar tuzilmasi",
  },
  {
    id: 10, direction: 'across', startRow: 9, startCol: 4,
    word: 'LOOP',
    clue: 'Kodni bir necha marta takrorlaydigan tuzilma',
  },
]
