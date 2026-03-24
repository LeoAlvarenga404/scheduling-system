import { User } from '../entities/user.entity';
import { DomainEvent } from '../events/domain-events';

export abstract class UserRepository {
  abstract findById(id: string): Promise<User | null>;
  abstract findByEmailAndTenant(email: string, tenantId: string | null): Promise<User | null>;
  abstract save(user: User, events?: DomainEvent[]): Promise<void>;
}
