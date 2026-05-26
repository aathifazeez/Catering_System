package com.catering.model;

import java.util.List;

public class Order {
    private int          orderId;
    private int          customerId;
    private String       customerName;   // joined field
    private String       eventType;
    private String       eventDate;
    private String       venue;
    private int          guestCount;
    private String       status;
    private String       notes;
    private String       createdAt;
    private List<OrderItem> items;

    public Order() {}

    /* ── getters & setters ── */
    public int    getOrderId()                      { return orderId; }
    public void   setOrderId(int id)                { this.orderId = id; }
    public int    getCustomerId()                   { return customerId; }
    public void   setCustomerId(int id)             { this.customerId = id; }
    public String getCustomerName()                 { return customerName; }
    public void   setCustomerName(String n)         { this.customerName = n; }
    public String getEventType()                    { return eventType; }
    public void   setEventType(String t)            { this.eventType = t; }
    public String getEventDate()                    { return eventDate; }
    public void   setEventDate(String d)            { this.eventDate = d; }
    public String getVenue()                        { return venue; }
    public void   setVenue(String v)                { this.venue = v; }
    public int    getGuestCount()                   { return guestCount; }
    public void   setGuestCount(int g)              { this.guestCount = g; }
    public String getStatus()                       { return status; }
    public void   setStatus(String s)               { this.status = s; }
    public String getNotes()                        { return notes; }
    public void   setNotes(String n)                { this.notes = n; }
    public String getCreatedAt()                    { return createdAt; }
    public void   setCreatedAt(String c)            { this.createdAt = c; }
    public List<OrderItem> getItems()               { return items; }
    public void   setItems(List<OrderItem> items)   { this.items = items; }

    /* ── nested class ── */
    public static class OrderItem {
        private int    itemId;
        private String itemName;
        private int    quantity;
        private double unitPrice;

        public OrderItem() {}
        public OrderItem(int itemId, String itemName, int quantity, double unitPrice) {
            this.itemId    = itemId;
            this.itemName  = itemName;
            this.quantity  = quantity;
            this.unitPrice = unitPrice;
        }
        public int    getItemId()              { return itemId; }
        public void   setItemId(int id)        { this.itemId = id; }
        public String getItemName()            { return itemName; }
        public void   setItemName(String n)    { this.itemName = n; }
        public int    getQuantity()            { return quantity; }
        public void   setQuantity(int q)       { this.quantity = q; }
        public double getUnitPrice()           { return unitPrice; }
        public void   setUnitPrice(double p)   { this.unitPrice = p; }
        public double getSubtotal()            { return unitPrice * quantity; }
    }
}
