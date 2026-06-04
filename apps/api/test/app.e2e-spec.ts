import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { EvlogGraphqlExceptionFilter } from '../src/common/filters/evlog-graphql-exception.filter';
import { CheckoutJobsService } from '../src/jobs/checkout-jobs.service';

function gql(server: ReturnType<INestApplication['getHttpServer']>) {
  return request(server).post('/graphql');
}

describe('GraphQL API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CheckoutJobsService)
      .useValue({
        enqueuePostCheckout: async () => ({
          correlationId: 'corr_e2e_test',
          jobId: 'corr_e2e_test',
          queue: 'post-checkout',
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new EvlogGraphqlExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('health query', () => {
    return gql(app.getHttpServer())
      .send({ query: '{ health { status } }' })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.health.status).toBe('ok');
      });
  });

  it('user query', () => {
    return gql(app.getHttpServer())
      .send({ query: '{ user(id: "usr_alice") { id name plan } }' })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.user.name).toBe('Alice Chen');
        expect(res.body.data.user.plan).toBe('PRO');
      });
  });

  it('checkout mutation', () => {
    return gql(app.getHttpServer())
      .send({
        query: `
          mutation Checkout($input: CheckoutInput!) {
            checkout(input: $input) {
              orderId
              transactionId
              totalCents
              asyncJob { correlationId queue }
            }
          }
        `,
        variables: {
          input: {
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
          },
        },
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.checkout.orderId).toMatch(/^ord_/);
        expect(res.body.data.checkout.transactionId).toMatch(/^txn_/);
        expect(res.body.data.checkout.totalCents).toBeGreaterThan(0);
        expect(res.body.data.checkout.asyncJob.queue).toBe('post-checkout');
      });
  });
});
