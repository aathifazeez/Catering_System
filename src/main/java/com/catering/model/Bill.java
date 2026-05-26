package com.catering.model;

public class Bill {
    private int    billId;
    private int    orderId;
    private String customerName;
    private String eventType;
    private String eventDate;
    private double subtotal;
    private double taxRate;
    private double taxAmount;
    private double discount;
    private double totalAmount;
    private boolean paid;
    private String createdAt;

    public Bill() {}

    public int     getBillId()                  { return billId; }
    public void    setBillId(int id)            { this.billId = id; }
    public int     getOrderId()                 { return orderId; }
    public void    setOrderId(int id)           { this.orderId = id; }
    public String  getCustomerName()            { return customerName; }
    public void    setCustomerName(String n)    { this.customerName = n; }
    public String  getEventType()               { return eventType; }
    public void    setEventType(String t)       { this.eventType = t; }
    public String  getEventDate()               { return eventDate; }
    public void    setEventDate(String d)       { this.eventDate = d; }
    public double  getSubtotal()                { return subtotal; }
    public void    setSubtotal(double s)        { this.subtotal = s; }
    public double  getTaxRate()                 { return taxRate; }
    public void    setTaxRate(double r)         { this.taxRate = r; }
    public double  getTaxAmount()               { return taxAmount; }
    public void    setTaxAmount(double t)       { this.taxAmount = t; }
    public double  getDiscount()                { return discount; }
    public void    setDiscount(double d)        { this.discount = d; }
    public double  getTotalAmount()             { return totalAmount; }
    public void    setTotalAmount(double t)     { this.totalAmount = t; }
    public boolean isPaid()                     { return paid; }
    public void    setPaid(boolean paid)        { this.paid = paid; }
    public String  getCreatedAt()               { return createdAt; }
    public void    setCreatedAt(String c)       { this.createdAt = c; }
}
