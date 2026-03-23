import { Entity } from '../core/entity';
import { PlanLimits } from '../value-objects/plan-limits';

export interface SubscriptionPlanProps {
  name: string;
  maxAppointmentsPerMonth: number | null;
  maxProfessionals: number | null;
  maxRooms: number | null;
  features: string[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class SubscriptionPlan extends Entity<SubscriptionPlanProps> {
  private constructor(props: SubscriptionPlanProps, id?: string) {
    super(props, id);
  }

  static create(props: SubscriptionPlanProps, id?: string): SubscriptionPlan {
    return new SubscriptionPlan({
      ...props,
      isActive: props.isActive ?? true,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    }, id);
  }

  get name(): string {
    return this.props.name;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  getLimits(): PlanLimits {
    return new PlanLimits(
      this.props.maxAppointmentsPerMonth,
      this.props.maxProfessionals,
      this.props.maxRooms,
      this.props.features
    );
  }
}
