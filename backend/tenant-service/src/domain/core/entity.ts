export abstract class Entity<T> {
  protected readonly _id: string;
  public readonly props: T;
  private _domainEvents: any[] = [];

  constructor(props: T, id?: string) {
    this._id = id ? id : crypto.randomUUID();
    this.props = props;
  }

  get id(): string {
    return this._id;
  }

  get domainEvents(): any[] {
    return [...this._domainEvents];
  }

  protected addDomainEvent(domainEvent: any): void {
    this._domainEvents.push(domainEvent);
  }

  public clearEvents(): void {
    this._domainEvents = [];
  }
}
