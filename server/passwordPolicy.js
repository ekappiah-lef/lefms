// Minimum bar for any password an Administrator sets on a user account:
// at least 8 characters, with a letter and a number   long enough and
// varied enough to resist trivial guessing/dictionary attacks without
// being so strict people just write it on a sticky note.
export function passwordError(password) {
  if (typeof password !== 'string' || password.length < 8) return 'Password must be at least 8 characters';
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) return 'Password must include both letters and numbers';
  return null;
}
