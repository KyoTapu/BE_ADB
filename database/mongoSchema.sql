//pricing_rules
{
  "_id": "rule_weekend",

  "hotel_id": "hotel_001",

  "room_type_id": "room_001",

  "priority": 1,

  "active": true,

  "conditions": {
    "day_of_week": ["FRI", "SAT"],
    "occupancy_gte": 70,
    "days_before_checkin_lte": 5
  },

  "actions": {
    "increase_percent": 20
  },

  "created_at": "2026-01-01"
}


//pricing_history
{
  "hotel_id": "hotel_001",

  "room_type_id": "room_001",

  "rate_date": "2026-05-10",

  "old_price": 180,

  "new_price": 240,

  "factors": {
    "occupancy_factor": 1.2,
    "weekend_factor": 1.15,
    "season_factor": 1.3
  },

  "created_at": "2026-05-01"
}

//occupancy_snapshots
{
  "hotel_id": "hotel_001",

  "date": "2026-05-10",

  "occupancy_percent": 82,

  "rooms_sold": 245,

  "rooms_available": 55
}

//search_logs
{
  "hotel_id": "hotel_001",

  "search_date": "2026-05-01",

  "checkin_date": "2026-05-10",

  "checkout_date": "2026-05-12",

  "guest_count": 2,

  "searched_room_type": "deluxe_king"
}