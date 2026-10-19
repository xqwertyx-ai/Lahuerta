// El tractor Pascuali amarillo de la finca. Aparece cuando la huerta llega al 100 %:
// estaba bajo una lona, lleno de polvo. Arreglarlo es un pequeño proyecto; una vez en marcha,
// los trabajos de arado y acarreo (tareas con `tractor: true` en zones.js) cuestan un jornal menos.
export const TRACTOR = {
  zone: 'huerta',
  name: 'El Pascuali amarillo',
  work: 5,                                   // jornales para ponerlo en marcha
  cost: { money: 80, herramientas: 1 },      // al empezar: piezas, aceite y una batería
  pro: 30,                                   // € por jornal si lo arregla el taller del pueblo
  found: 'Con la huerta impecable, al quitar una lona vieja detrás del cobertizo aparece el Pascuali amarillo: polvo, óxido en los guardabarros y las ruedas medio deshinchadas. Con unos días de trabajo volverá a arrancar.',
  ready: 'El Pascuali tose, echa una nube azul… y arranca. Ahora cavar, segar el heno, varear la bellota, desbrozar la dehesa y acarrear piedra cuestan un jornal menos.',
};
