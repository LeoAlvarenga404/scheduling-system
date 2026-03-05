import { UniqueEntityID } from "./unique-entity-id";
import { DomainEvent } from "../../events/domain-event";
export class Entity<Props> {
  private _id: UniqueEntityID;
  protected props: Props;

  private domainEvents: DomainEvent[] = [];

  get id() {
    return this._id;
  }

  protected constructor(props: Props, id?: UniqueEntityID) {
    this.props = props;
    this._id = id ?? new UniqueEntityID();
  }

  protected addDomainEvent(event: DomainEvent) {
    this.domainEvents.push(event);
  }

  public getDomainEvents(): DomainEvent[] {
    return this.domainEvents;
  }

  public clearEvents() {
    this.domainEvents = [];
  }
}
