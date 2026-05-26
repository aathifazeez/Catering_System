package com.catering.dao;

import com.catering.model.Order;
import com.catering.model.Order.OrderItem;
import com.catering.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class OrderDAO {

    public List<Order> getAll() throws SQLException {
        List<Order> list = new ArrayList<>();
        String sql = "SELECT o.*, c.name AS customer_name " +
                     "FROM orders o JOIN customers c ON o.customer_id = c.customer_id " +
                     "ORDER BY o.created_at DESC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) list.add(mapOrder(rs));
        }
        return list;
    }

    public Order getById(int orderId) throws SQLException {
        String sql = "SELECT o.*, c.name AS customer_name " +
                     "FROM orders o JOIN customers c ON o.customer_id = c.customer_id " +
                     "WHERE o.order_id = ?";
        Order order = null;
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, orderId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) order = mapOrder(rs);
            }
        }
        if (order != null) order.setItems(getOrderItems(orderId));
        return order;
    }

    public List<OrderItem> getOrderItems(int orderId) throws SQLException {
        List<OrderItem> items = new ArrayList<>();
        String sql = "SELECT oi.*, m.name AS item_name FROM order_items oi " +
                     "JOIN menu_items m ON oi.item_id = m.item_id WHERE oi.order_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, orderId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    items.add(new OrderItem(
                        rs.getInt("item_id"),
                        rs.getString("item_name"),
                        rs.getInt("quantity"),
                        rs.getDouble("unit_price")
                    ));
                }
            }
        }
        return items;
    }

    /** Creates order + order_items in a single transaction. Returns new order_id. */
    public int create(Order order) throws SQLException {
        Connection conn = DBConnection.getConnection();
        conn.setAutoCommit(false);
        try {
            // Insert order
            String orderSql = "INSERT INTO orders (customer_id, event_type, event_date, venue, guest_count, status, notes) " +
                              "VALUES (?,?,?,?,?,?,?)";
            int orderId;
            try (PreparedStatement ps = conn.prepareStatement(orderSql, Statement.RETURN_GENERATED_KEYS)) {
                ps.setInt(1, order.getCustomerId());
                ps.setString(2, order.getEventType());
                ps.setString(3, order.getEventDate());
                ps.setString(4, order.getVenue());
                ps.setInt(5, order.getGuestCount());
                ps.setString(6, order.getStatus() == null ? "Pending" : order.getStatus());
                ps.setString(7, order.getNotes());
                ps.executeUpdate();
                try (ResultSet keys = ps.getGeneratedKeys()) {
                    keys.next();
                    orderId = keys.getInt(1);
                }
            }

            // Insert order items
            if (order.getItems() != null) {
                String itemSql = "INSERT INTO order_items (order_id, item_id, quantity, unit_price) VALUES (?,?,?,?)";
                try (PreparedStatement ps = conn.prepareStatement(itemSql)) {
                    for (OrderItem item : order.getItems()) {
                        ps.setInt(1, orderId);
                        ps.setInt(2, item.getItemId());
                        ps.setInt(3, item.getQuantity());
                        ps.setDouble(4, item.getUnitPrice());
                        ps.addBatch();
                    }
                    ps.executeBatch();
                }
            }

            conn.commit();
            return orderId;
        } catch (SQLException e) {
            conn.rollback();
            throw e;
        } finally {
            conn.setAutoCommit(true);
            conn.close();
        }
    }

    public boolean updateStatus(int orderId, String status) throws SQLException {
        String currentStatus = null;
        String selectSql = "SELECT status FROM orders WHERE order_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(selectSql)) {
            ps.setInt(1, orderId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    currentStatus = rs.getString("status");
                }
            }
        }

        String sql = "UPDATE orders SET status = ? WHERE order_id = ?";
        boolean updated;
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, status);
            ps.setInt(2, orderId);
            updated = ps.executeUpdate() > 0;
        }

        if (updated && ("Confirmed".equals(status) || "In Progress".equals(status)) && "Pending".equals(currentStatus)) {
            try {
                new InventoryDAO().deductForOrder(orderId);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return updated;
    }

    public boolean delete(int orderId) throws SQLException {
        String sql = "DELETE FROM orders WHERE order_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, orderId);
            return ps.executeUpdate() > 0;
        }
    }

    /* ── Dashboard summary queries ── */

    public int getTotalOrders() throws SQLException {
        return countQuery("SELECT COUNT(*) FROM orders");
    }

    public int getTotalCustomers() throws SQLException {
        return countQuery("SELECT COUNT(*) FROM customers");
    }

    public double getTotalRevenue() throws SQLException {
        String sql = "SELECT COALESCE(SUM(total_amount), 0) FROM bills WHERE paid = TRUE";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            return rs.next() ? rs.getDouble(1) : 0;
        }
    }

    public int getPendingOrders() throws SQLException {
        String sql = "SELECT COUNT(*) FROM orders WHERE status = 'Pending'";
        return countQuery(sql);
    }

    private int countQuery(String sql) throws SQLException {
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            return rs.next() ? rs.getInt(1) : 0;
        }
    }

    private Order mapOrder(ResultSet rs) throws SQLException {
        Order o = new Order();
        o.setOrderId(rs.getInt("order_id"));
        o.setCustomerId(rs.getInt("customer_id"));
        o.setCustomerName(rs.getString("customer_name"));
        o.setEventType(rs.getString("event_type"));
        o.setEventDate(rs.getString("event_date"));
        o.setVenue(rs.getString("venue"));
        o.setGuestCount(rs.getInt("guest_count"));
        o.setStatus(rs.getString("status"));
        o.setNotes(rs.getString("notes"));
        o.setCreatedAt(rs.getString("created_at"));
        return o;
    }
}
