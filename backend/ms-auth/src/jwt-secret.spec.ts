import { exigirJwtSecret } from './auth.module';

/** Bloque 1 de la auditoría (issue #1): sin secreto propio, ms-auth no arranca. */
describe('exigirJwtSecret', () => {
  it('falla si JWT_SECRET no está definido', () => {
    expect(() => exigirJwtSecret({})).toThrow('JWT_SECRET no está definido');
  });

  it('falla si JWT_SECRET está vacío', () => {
    expect(() => exigirJwtSecret({ JWT_SECRET: '   ' })).toThrow('JWT_SECRET no está definido');
  });

  it('en producción rechaza los valores de ejemplo del repositorio', () => {
    expect(() =>
      exigirJwtSecret({ JWT_SECRET: 'change_me_in_production', NODE_ENV: 'production' }),
    ).toThrow('valor de ejemplo');
  });

  it('en desarrollo acepta el valor del .env.example', () => {
    expect(exigirJwtSecret({ JWT_SECRET: 'change_me_in_production' })).toBe(
      'change_me_in_production',
    );
  });

  it('devuelve el secreto configurado', () => {
    expect(exigirJwtSecret({ JWT_SECRET: 'abc123', NODE_ENV: 'production' })).toBe('abc123');
  });
});
