package com.catering.dao;

import com.catering.model.InventoryItem;
import com.catering.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class InventoryDAO {

    public List<InventoryItem> getAll() throws SQLException {
        List<InventoryItem> list = new ArrayList<>();
        String sql = "SELECT * FROM inventory ORDER BY name ASC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) list.add(map(rs));
        }
        return list;
    }

    public InventoryItem getById(int id) throws SQLException {
        String sql = "SELECT * FROM inventory WHERE item_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return map(rs);
            }
        }
        return null;
    }

    public int create(InventoryItem item) throws SQLException {
        String sql = "INSERT INTO inventory (name, quantity, unit, min_level) VALUES (?,?,?,?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, item.getName());
            ps.setDouble(2, item.getQuantity());
            ps.setString(3, item.getUnit());
            ps.setDouble(4, item.getMinLevel());
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) return keys.getInt(1);
            }
        }
        return -1;
    }

    public boolean update(InventoryItem item) throws SQLException {
        String sql = "UPDATE inventory SET name=?, quantity=?, unit=?, min_level=? WHERE item_id=?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, item.getName());
            ps.setDouble(2, item.getQuantity());
            ps.setString(3, item.getUnit());
            ps.setDouble(4, item.getMinLevel());
            ps.setInt(5, item.getItemId());
            return ps.executeUpdate() > 0;
        }
    }

    public boolean delete(int id) throws SQLException {
        String sql = "DELETE FROM inventory WHERE item_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        }
    }

    /**
     * Automatically deducts raw ingredients from inventory based on order items when an order is Confirmed.
     */
    public void deductForOrder(int orderId) throws SQLException {
        String query = "SELECT oi.quantity, m.name AS menu_item_name " +
                       "FROM order_items oi " +
                       "JOIN menu_items m ON oi.item_id = m.item_id " +
                       "WHERE oi.order_id = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(query)) {
            ps.setInt(1, orderId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    int qty = rs.getInt("quantity");
                    String itemName = rs.getString("menu_item_name").toLowerCase();

                    double rice = 0;
                    double chicken = 0;
                    double veg = 0;
                    double oil = 0;
                    double sugar = 0;
                    double flour = 0;

                    if (itemName.contains("biriyani")) {
                        rice += qty * 0.25;
                        chicken += qty * 0.20;
                        oil += qty * 0.05;
                    } else if (itemName.contains("rice") || itemName.contains("curry")) {
                        rice += qty * 0.20;
                        veg += qty * 0.15;
                        oil += qty * 0.03;
                    } else if (itemName.contains("satay") || itemName.contains("chicken")) {
                        chicken += qty * 0.15;
                        oil += qty * 0.02;
                    } else if (itemName.contains("rolls")) {
                        veg += qty * 0.08;
                        oil += qty * 0.03;
                    } else if (itemName.contains("cake") || itemName.contains("watalappan") || itemName.contains("dessert")) {
                        sugar += qty * 0.05;
                        flour += qty * 0.05;
                    }

                    // Perform database updates for inventory items matching names
                    if (rice > 0) updateStock(conn, "Rice", rice);
                    if (chicken > 0) updateStock(conn, "Chicken", chicken);
                    if (veg > 0) updateStock(conn, "Vegetables", veg);
                    if (oil > 0) updateStock(conn, "Cooking Oil", oil);
                    if (sugar > 0) updateStock(conn, "Sugar", sugar);
                    if (flour > 0) updateStock(conn, "Flour", flour);
                }
            }
        }
    }

    private void updateStock(Connection conn, String ingredientName, double amount) throws SQLException {
        String sql = "UPDATE inventory SET quantity = GREATEST(quantity - ?, 0) WHERE name = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setDouble(1, amount);
            ps.setString(2, ingredientName);
            ps.executeUpdate();
        }
    }

    private InventoryItem map(ResultSet rs) throws SQLException {
        return new InventoryItem(
            rs.getInt("item_id"),
            rs.getString("name"),
            rs.getDouble("quantity"),
            rs.getString("unit"),
            rs.getDouble("min_level"),
            rs.getString("updated_at")
        );
    }
}
