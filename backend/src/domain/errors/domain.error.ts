/**
 * Base class for every error the domain can raise. Adapters (HTTP, providers)
 * map these to their own protocol (status codes, retries) without the domain
 * knowing anything about that protocol.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
