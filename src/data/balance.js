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
    money: 150,
    mood: 60,          // ánimo
    reputation: 5,
    materials: { lena: 6, piedra: 4, cal: 2, herramientas: 3 },
    products: { huevos: 0 },
  },

  // ── Jornales (energía diaria) ──
  playerJornales: 5,
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
  baseDecayPerDay: 1.0,
  weedGrowthPerDay: 2.2,        // maleza por día (primavera más)
  weedDecayFactor: 0.012,       // la maleza acelera el deterioro: decay *= 1 + maleza*factor
  restoredThreshold: 70,        // a partir de aquí una zona cuenta como «restaurada»
  // Rendimiento decreciente: cuanto mejor está una zona, menos sube con cada cuidado
  diminishFrom: 30,             // por debajo, cada tarea rinde entero
  diminishSpan: 90,             // a 30 + 90 = 120 el rendimiento sería 0 (con un mínimo)
  diminishMin: 0.25,
  // Reputación: no puede quedarse muy por encima de lo que la finca merece
  repDecay: 0.25,               // por día si está por encima del objetivo

  // ── Fuego ──
  fireBaseRisk: 0.004,          // probabilidad diaria base en verano
  fireWeedFactor: 0.00025,      // + por punto de maleza media
  fireHeatBonus: 0.01,

  // ── Economía ──
  foodCostPerVolunteer: 2,      // € por día si no hay comida de la finca
  foodFromFarmPerVolunteer: 1,  // unidades de comida (huevos/hortalizas) por voluntario y día
  debtLimit: -150,              // por debajo, la finca está en números rojos
  priceRecoveryPerDay: 0.18,    // los precios saturados vuelven a la normalidad
  saturationPerUnit: 0.035,     // cada unidad vendida baja el precio del canal
  marketEveryDays: 7,           // mercado de Fuente Obejuna (el día 1 de cada semana)
  coopPriceFactor: 0.72,
  marketPriceFactor: 1.1,
  basketPriceFactor: 1.35,

  // ── Voluntarios ──
  volunteerArrivalBase: 0.12,   // probabilidad diaria con cama libre
  volunteerArrivalPerRep: 0.0025,
  bedsBase: 1,                  // camas con el cortijo muy mal
  bedsPerCortijo: 1 / 34,       // + 1 cama cada 34 puntos del cortijo (máximo 3)
  volunteerStayDays: [8, 16],

  // ── Agroturismo ──
  tourismUnlock: { cortijo: 65, reputation: 20 },
  visitorBase: 0.1,
  visitorPerRep: 0.006,
  nightPrice: 32,
  guestCostPerNight: 8,          // desayuno, sábanas y luz

  // ── Derrota suave ──
  ruinDaysToWarn: 5,
  ruinDaysToSleep: 14,          // una estación entera en números rojos
  abandonThreshold: 22,         // conservación media
  abandonDaysToSleep: 14,

  // ── Eventos ──
  eventChancePerDay: 0.42,
  eventMinGapDays: 1,

  // ── Misterio ──
  catFindChancePerDay: 0.06,
  itemChanceOnRestore: 1.0,     // al restaurar una zona por primera vez aparece su objeto
  itemChanceOnTask: 0.05,
};
