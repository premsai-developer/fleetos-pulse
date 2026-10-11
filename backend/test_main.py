import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "FleetOS Pulse" in data["service"]

def test_get_trips():
    response = client.get("/api/trips")
    assert response.status_code == 200
    trips = response.json()
    assert isinstance(trips, list)
    assert len(trips) >= 5
    first_trip = trips[0]
    assert "id" in first_trip
    assert "origin" in first_trip
    assert "destination" in first_trip

def test_get_trip_detail():
    response = client.get("/api/trips/TRIP-101")
    assert response.status_code == 200
    trip = response.json()
    assert trip["id"] == "TRIP-101"
    assert trip["origin"] == "Visakhapatnam"

def test_create_decision_acceptance():
    payload = {
        "tripId": "TRIP-101",
        "action": "Raise fare",
        "proposedFare": 720.0,
        "reason": "Test acceptance from pytest suite",
        "source": "recommendation",
        "status": "accepted"
    }
    response = client.post("/api/decisions", json=payload)
    assert response.status_code == 200
    decision = response.json()
    assert decision["tripId"] == "TRIP-101"
    assert decision["status"] == "accepted"
    assert decision["proposedFare"] == 720.0

    # Verify trip fare updated
    trip_resp = client.get("/api/trips/TRIP-101")
    assert trip_resp.json()["fare"] == 720.0

def test_create_passenger_ticket():
    payload = {
        "tripId": "TRIP-101",
        "passengerName": "Vikram Seth",
        "passengerEmail": "vikram@example.com",
        "seatNumber": 12,
        "approvedFare": 720.0,
        "route": "Visakhapatnam → Vijayawada"
    }
    response = client.post("/api/tickets", json=payload)
    assert response.status_code == 200
    ticket = response.json()
    assert ticket["passengerName"] == "Vikram Seth"
    assert ticket["seatNumber"] == 12

def test_discrepancy_resolution():
    response = client.post("/api/discrepancies/DISC-301/resolve")
    assert response.status_code == 200
    data = response.json()
    assert data["state"] == "Resolved"

def test_api_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_get_dashboard():
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "activeDepartures" in data
    assert "totalBooked" in data

def test_get_recommendations():
    response = client.get("/api/recommendations")
    assert response.status_code == 200
    recs = response.json()
    assert isinstance(recs, list)
    assert len(recs) > 0

def test_get_data_health():
    response = client.get("/api/data-health")
    assert response.status_code == 200
    assert "staleData" in response.json()

def test_get_audit():
    response = client.get("/api/audit")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_demo_reset():
    response = client.post("/api/demo/reset")
    assert response.status_code == 200
    assert response.json()["status"] == "success"

def test_demo_scenarios():
    for sid in ["capacity_shortage", "low_demand", "stale_data", "operator_approval"]:
        res = client.post(f"/api/demo/scenario/{sid}")
        assert res.status_code == 200
        assert res.json()["status"] == "success"

    # Reset after scenario testing
    client.post("/api/demo/reset")


