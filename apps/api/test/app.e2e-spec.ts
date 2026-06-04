import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Checkout (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('/users/:id (GET)', () => {
    return request(app.getHttpServer())
      .get('/users/usr_alice')
      .expect(200)
      .expect((res) => {
        expect(res.body.name).toBe('Alice Chen');
      });
  });

  it('/checkout (POST) completes order', () => {
    return request(app.getHttpServer())
      .post('/checkout')
      .send({
        userId: 'usr_alice',
        items: [
          { sku: 'sku_keyboard', quantity: 1 },
          { sku: 'sku_headset', quantity: 1 },
        ],
        card: {
          last4: '4242',
          brand: 'visa',
          expiryMonth: 12,
          expiryYear: 2030,
        },
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.orderId).toMatch(/^ord_/);
        expect(res.body.transactionId).toMatch(/^txn_/);
        expect(res.body.totalCents).toBeGreaterThan(0);
      });
  });
});
