"""SQLAlchemy ORM models (database tables).

Models are declared with the SQLAlchemy 2.0 typed ``Mapped[...]`` style. Tables are
added feature by feature: events, registrations and users.
"""

from app.db import Base

__all__ = ["Base"]
