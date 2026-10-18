// Números de equilibrio del juego. Todo lo que se quiera ajustar sin tocar el código está aquí.

export const BALANCE = {
  // ── Tiempo ──
  realSecondsPerDay: 120,      // un día de juego dura 2 minutos reales a x1
  daysPerSeason: 14,           // días por estación
  dawnHour: 6,                 // a esta hora se reparte el día (jornales, precios, eventos)
  startHour: 7,
  startSeason: 2,              // 0 primavera, 1 verano, 2 otoño, 3 invierno (empezamos en otoño)
  speeds: [0, 1, 2, 3],

  // ── Recursos iniciales ──
  start: {
    money: 120,
    mood: 60,          // ánimo
    reputation: 5,
    materials: { lena: 6, piedra: 4, cal: 2, herramientas: 3 },
    products: { huevos: 0 },
  },

  // ── Jornales (energía diaria) ──
  playerJornales: 3,
  volunteerJornales: 2,
  employeeJornales: 3,
  employeeWagePerDay: 22,

  // ── Ánimo ──
  moodDailyDrift: 0.6,          // tiende a 55 poco a poco
  moodRestTarget: 55,
  moodPerRestoredZone: 1.5,
  moodLowConservation: -2,      // por día si la conservación media es baja
  moodDebt: -1.5,

  // ── Deterioro ──
  // Puntos de conservación que se pierden por día (multiplicados por el de la zona y el clima)
  baseDecayPerDay: 0.85,
  weedGrowthPerDay: 2.2,        // maleza por día (primavera más)
  weedDecayFactor: 0.012,       // la maleza acelera el deterioro: decay *= 1 + maleza*factor
  restoredThreshold: 70,        // a partir de aquí una zona cuenta como «restaurada»

  // ── Fuego ──
  fireBaseRisk: 0.004,          // probabilidad diaria base en verano
  fireWeedFactor: 0.00025,      // + por punto de maleza media
  fireHeatBonus: 0.01,

  // ── Economía ──
  foodCostPerVolunteer: 3,      // € por día si no hay comida de la finca
  foodFromFarmPerVolunteer: 1,  // unidades de comida (huevos/hortalizas) por voluntario y día
  debtLimit: -150,              // por debajo, la finca está en números rojos
  priceRecoveryPerDay: 0.18,    // los precios saturados vuelven a la normalidad
  saturationPerUnit: 0.035,     // cada unidad vendida baja el precio del canal
  marketEveryDays: 7,           // mercado de Fuente Obejuna (el día 1 de cada semana)
  coopPriceFactor: 0.72,
  marketPriceFactor: 1.0,
  basketPriceFactor: 1.35,

  // ── Voluntarios ──
  volunteerArrivalBase: 0.22,   // probabilidad diaria con cama libre
  volunteerArrivalPerRep: 0.004,
  bedsBase: 1,                  // camas con el cortijo muy mal
  bedsPerCortijo: 1 / 30,       // + 1 cama cada 30 puntos del cortijo
  volunteerStayDays: [8, 16],

  // ── Agroturismo ──
  tourismUnlock: { cortijo: 65, reputation: 20 },
  visitorBase: 0.15,
  visitorPerRep: 0.012,
  nightPrice: 38,

  // ── Derrota suave ──
  ruinDaysToWarn: 5,
  ruinDaysToSleep: 14,          // una estación entera en números rojos
  abandonThreshold: 22,         // conservación media
  abandonDaysToSleep: 14,

  // ── Eventos ──
  eventChancePerDay: 0.55,
  eventMinGapDays: 1,

  // ── Misterio ──
  catFindChancePerDay: 0.06,
  itemChanceOnRestore: 1.0,     // al restaurar una zona por primera vez aparece su objeto
  itemChanceOnTask: 0.05,
};
