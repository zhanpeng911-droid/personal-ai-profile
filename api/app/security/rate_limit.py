from __future__ import annotations

import time
from collections import defaultdict
from dataclasses import dataclass, field
from threading import Lock


@dataclass
class RateLimiter:
    """In-memory counters for a single API process."""

    verify_fail_limit: int = 10
    verify_fail_window: int = 600
    _verify_fails: dict[str, list[float]] = field(default_factory=lambda: defaultdict(list))
    _chat_usage: dict[str, dict[str, int]] = field(default_factory=dict)
    _total_uses: dict[str, int] = field(default_factory=dict)
    _lock: Lock = field(default_factory=Lock)

    def _day_key(self) -> str:
        return time.strftime("%Y-%m-%d", time.gmtime())

    def note_verify_failure(self, ip: str) -> None:
        now = time.time()
        with self._lock:
            bucket = self._verify_fails[ip]
            self._verify_fails[ip] = [t for t in bucket if now - t < self.verify_fail_window]
            self._verify_fails[ip].append(now)

    def verify_blocked(self, ip: str) -> bool:
        now = time.time()
        with self._lock:
            bucket = [t for t in self._verify_fails.get(ip, []) if now - t < self.verify_fail_window]
            self._verify_fails[ip] = bucket
            return len(bucket) >= self.verify_fail_limit

    def clear_verify_failures(self, ip: str) -> None:
        with self._lock:
            self._verify_fails.pop(ip, None)

    def remaining(self, invite_id: str, daily_limit: int) -> int:
        day = self._day_key()
        with self._lock:
            used = self._chat_usage.get(invite_id, {}).get(day, 0)
            return max(0, daily_limit - used)

    def consume_chat(self, invite_id: str, daily_limit: int) -> int:
        """Consume one chat quota. Returns remaining after consume. Raises ValueError if exhausted."""
        day = self._day_key()
        with self._lock:
            day_map = self._chat_usage.setdefault(invite_id, {})
            used = day_map.get(day, 0)
            if used >= daily_limit:
                raise ValueError("daily_limit_exceeded")
            day_map[day] = used + 1
            self._total_uses[invite_id] = self._total_uses.get(invite_id, 0) + 1
            return max(0, daily_limit - day_map[day])

    def total_uses(self, invite_id: str) -> int:
        with self._lock:
            return self._total_uses.get(invite_id, 0)


limiter = RateLimiter()
