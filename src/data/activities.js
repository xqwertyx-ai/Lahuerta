// Ratos libres: actividades artísticas y de ocio que suben el ánimo de la casa y de los voluntarios.
// cost: jornales, dinero, materiales o productos ('food' = cualquier comida de la finca)
// happy: cuánto se alegran los voluntarios · mood: ánimo de la casa · cooldown: días hasta repetir
// requires: zonas desbloqueadas (y conservación), estaciones, horas, tiempo que no puede hacer

export const ACTIVITIES = [
  { id: 'acuarela', name: 'Tarde de acuarela en el patio', cost: { jornales: 1 }, happy: 8, mood: 4, cooldown: 4,
    text: 'Papel, agua y la fuente de modelo. Nadie pinta bien y da igual.' },
  { id: 'comida', name: 'Comida larga en el patio', cost: { money: 12 }, happy: 10, mood: 5, cooldown: 6,
    text: 'Mesa bajo la parra, sobremesa hasta las tantas y el gato pidiendo.' },
  { id: 'comida_finca', name: 'Comida con lo de la finca', cost: { food: 4 }, happy: 12, mood: 6, cooldown: 6,
    text: 'Todo lo de la mesa ha salido de aquí. Se nota y se dice.' },
  { id: 'paseo', name: 'Paseo al atardecer por la dehesa', cost: { jornales: 1 }, happy: 6, mood: 3, cooldown: 3, requires: { notWeather: ['lluvia', 'tormenta'] },
    text: 'Entre encinas hasta el berrocal grande, con el pueblo encendiéndose a lo lejos.' },
  { id: 'musica', name: 'Música en el cenador', cost: { jornales: 1 }, happy: 10, mood: 6, cooldown: 4, requires: { zones: { piano: 40 } },
    text: 'Alguien se atreve con el piano, otra canta, el resto da palmas.' },
  { id: 'estrellas', name: 'Noche de estrellas sobre una manta', cost: { jornales: 1 }, happy: 8, mood: 4, cooldown: 5, requires: { notWeather: ['lluvia', 'tormenta', 'nubes', 'niebla'] },
    text: 'Aquí la Vía Láctea se ve entera. Alguien cuenta estrellas fugaces; nadie lleva la cuenta.' },
  { id: 'bano', name: 'Baño en la alberca', cost: { jornales: 1 }, happy: 10, mood: 5, cooldown: 4, requires: { seasons: [1], zones: { alberca: 50 } },
    text: 'Agua fría, risas y los juncos de testigo.' },
  { id: 'mosaico', name: 'Taller de mosaico en los bancos', cost: { jornales: 1, cal: 0.5 }, happy: 7, mood: 3, cooldown: 5, zoneCare: { bancos: 6 },
    text: 'Teselas de azulejo roto, cemento cola y paciencia. Los bancos lo agradecen.' },
  { id: 'candela', name: 'Candela y castañas', cost: { lena: 2 }, happy: 8, mood: 4, cooldown: 5, requires: { seasons: [2, 3] },
    text: 'Fuego de encina en el patio, castañas asadas y alguna historia de miedo.' },
  { id: 'cine', name: 'Cine de verano en la pared del cortijo', cost: { money: 5 }, happy: 8, mood: 4, cooldown: 6, requires: { seasons: [1], zones: { cortijo: 60 } },
    text: 'Una sábana, un proyector viejo y la fachada recién encalada de pantalla.' },
];

export const ACTIVITY_BY_ID = Object.fromEntries(ACTIVITIES.map((a) => [a.id, a]));
