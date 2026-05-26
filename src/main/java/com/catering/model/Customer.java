package com.catering.model;

public class Customer {
    private int    customerId;
    private String name;
    private String email;
    private String phone;
    private String address;
    private String createdAt;
    private int    loyaltyPoints;

    public Customer() {}

    public Customer(int customerId, String name, String email, String phone, String address, String createdAt, int loyaltyPoints) {
        this.customerId    = customerId;
        this.name          = name;
        this.email         = email;
        this.phone         = phone;
        this.address       = address;
        this.createdAt     = createdAt;
        this.loyaltyPoints = loyaltyPoints;
    }

    public int    getCustomerId()          { return customerId; }
    public void   setCustomerId(int id)    { this.customerId = id; }
    public String getName()               { return name; }
    public void   setName(String name)    { this.name = name; }
    public String getEmail()              { return email; }
    public void   setEmail(String email)  { this.email = email; }
    public String getPhone()              { return phone; }
    public void   setPhone(String phone)  { this.phone = phone; }
    public String getAddress()            { return address; }
    public void   setAddress(String a)    { this.address = a; }
    public String getCreatedAt()          { return createdAt; }
    public void   setCreatedAt(String c)  { this.createdAt = c; }
    public int    getLoyaltyPoints()      { return loyaltyPoints; }
    public void   setLoyaltyPoints(int p) { this.loyaltyPoints = p; }
}
