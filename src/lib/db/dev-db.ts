// Mock database for local development
import { isDevMode } from '@/lib/auth/dev-auth';

// In-memory storage for dev mode (placeholder for future implementation)
// const devStorage = {
//   conversations: new Map<string, Conversation>(),
//   messages: new Map<string, Message[]>(),
//   userBattery: new Map<string, UserBattery>(),
//   dailyUsage: new Map<string, { totalBatteryUsed: number }>(),
// };

export function getDevDb() {
  if (!isDevMode()) {
    throw new Error('Dev DB should only be used in dev mode');
  }

  return {
    select() {
      return {
        from(table: any) {
          return {
            where() {
              return {
                get() {
                  // Return mock data based on table
                  if (table.userBattery) {
                    return null; // Will trigger creation of default battery
                  }
                  return null;
                },
                all() {
                  return [];
                },
              };
            },
            all() {
              // Return empty arrays for now
              return [];
            },
            orderBy() {
              return {
                all() {
                  return [];
                },
              };
            },
          };
        },
      };
    },
    insert() {
      return {
        values() {
          return {
            returning() {
              return {
                get() {
                  // Return mock inserted data
                  return {
                    id: `temp-${Math.random().toString(36).substring(7)}`,
                    userId: 'dev-user',
                    title: 'New Conversation',
                    model: 'claude-3-5-sonnet-20241022',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  };
                },
              };
            },
            onConflictDoNothing() {
              return Promise.resolve();
            },
            run() {
              return Promise.resolve();
            },
          };
        },
      };
    },
    update() {
      return {
        set() {
          return {
            where() {
              return {
                run() {
                  return Promise.resolve();
                },
              };
            },
          };
        },
      };
    },
    delete() {
      return {
        where() {
          return {
            run() {
              return Promise.resolve();
            },
          };
        },
      };
    },
  };
}
