package com.catering.model;

public class MenuItem {

    private int itemId;
    private String name;
    private String category;
    private double price;
    private String description;
    private boolean available;
    private String imageUrl;

    public MenuItem() {
    }

    public MenuItem(
            int itemId,
            String name,
            String category,
            double price,
            String description,
            boolean available,
            String imageUrl) {
        this.itemId = itemId;
        this.name = name;
        this.category = category;
        this.price = price;
        this.description = description;
        this.available = available;
        this.imageUrl = imageUrl;
    }

    public int getItemId() {
        return itemId;
    }

    public void setItemId(int id) {
        this.itemId = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String c) {
        this.category = c;
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String d) {
        this.description = d;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean avail) {
        this.available = avail;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}