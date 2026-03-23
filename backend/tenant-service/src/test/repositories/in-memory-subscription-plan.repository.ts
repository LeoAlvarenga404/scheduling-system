import { ISubscriptionPlanRepository } from '../../domain/repositories/tenant-repository.interface';
import { SubscriptionPlan } from '../../domain/entities/subscription-plan';

export class InMemorySubscriptionPlanRepository implements ISubscriptionPlanRepository {
  public items: SubscriptionPlan[] = [];

  async findById(id: string): Promise<SubscriptionPlan | null> {
    const plan = this.items.find(p => p.id === id);
    return plan || null;
  }

  async findAll(): Promise<SubscriptionPlan[]> {
    return this.items;
  }
}
