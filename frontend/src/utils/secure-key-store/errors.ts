export class InvalidPassphraseError extends Error {
    constructor(message = "Invalid passphrase") {
        super(message);
        this.name = "InvalidPassphraseError";
    }
}

export class NotConfiguredError extends Error {
    constructor(message = "Secure key store is not configured") {
        super(message);
        this.name = "NotConfiguredError";
    }
}

export class LockedError extends Error {
    constructor(message = "Secure key store is locked") {
        super(message);
        this.name = "LockedError";
    }
}

export class StorageError extends Error {
    constructor(message = "IndexedDB storage error") {
        super(message);
        this.name = "StorageError";
    }
}
