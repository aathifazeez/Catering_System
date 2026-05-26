package com.catering.model;

public class InventoryItem {
    private int    itemId;
    private String name;
    private double quantity;
    private String unit;
    private double minLevel;
    private String updatedAt;

    public InventoryItem() {}

    public InventoryItem(int itemId, String name, double quantity, String unit, double minLevel, String updatedAt) {
        this.itemId    = itemId;
        this.name      = name;
        this.quantity  = quantity;
        this.unit      = unit;
        this.minLevel  = minLevel;
        this.updatedAt = updatedAt;
    }

    public int    getItemId()              { return itemId; }
    public void   setItemId(int id)        { this.itemId = id; }
    public String getName()                { return name; }
    public void   setName(String name)     { this.name = name; }
    public double getQuantity()            { return quantity; }
    public void   setQuantity(double q)    { this.quantity = q; }
    public String getUnit()                { return unit; }
    public void   setUnit(String u)        { this.unit = u; }
    public double getMinLevel()            { return minLevel; }
    public void   setMinLevel(double m)    { this.minLevel = m; }
    public String getUpdatedAt()            { return updatedAt; }
    public void   setUpdatedAt(String u)   { this.updatedAt = u; }
}
