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
     * Automatically deducts raw ingredients from inventory when an order is Confirmed.
     * Uses the recipe_ingredients table — no hardcoded name matching.
     * Deduction amount = order quantity × quantity_per_serving for each ingredient.
     */
    public void deductForOrder(int orderId) throws SQLException {
        String query =
            "SELECT oi.quantity AS order_qty, " +
            "       r.quantity_per_serving, " +
            "       i.name AS ingredient_name " +
            "FROM order_items oi " +
            "JOIN recipe_ingredients r ON oi.item_id = r.menu_item_id " +
            "JOIN inventory i          ON r.inventory_item_id = i.item_id " +
            "WHERE oi.order_id = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(query)) {
            ps.setInt(1, orderId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    double deductAmount = rs.getInt("order_qty") * rs.getDouble("quantity_per_serving");
                    updateStock(conn, rs.getString("ingredient_name"), deductAmount);
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
