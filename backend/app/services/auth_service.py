import hashlib
import os

def hash_password(password: str) -> str:
    """Generates a secure SHA-256 hash with a random salt."""
    if not password:
        return ""
    salt = os.urandom(16).hex()
    hashed = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    ).hex()
    return f"{salt}${hashed}"

def verify_password(plain_password: str, stored_password_hash: str) -> bool:
    """Verifies a plain password against the stored salt$hash."""
    if not stored_password_hash:
        return True
    if not plain_password:
        return False
        
    try:
        salt, expected_hash = stored_password_hash.split('$', 1)
        computed_hash = hashlib.pbkdf2_hmac(
            'sha256',
            plain_password.encode('utf-8'),
            salt.encode('utf-8'),
            100000
        ).hex()
        return computed_hash == expected_hash
    except Exception:
        return False
