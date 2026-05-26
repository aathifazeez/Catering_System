package com.catering.dao;

import com.catering.model.Bill;
import com.catering.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class BillDAO {

    public List<Bill> getAll() throws SQLException {
        List<Bill> list = new ArrayList<>();
        String sql = "SELECT b.*, c.name AS customer_name, o.event_type, o.event_date " +
                     "FROM bills b " +
                     "JOIN orders o ON b.order_id = o.order_id " +
                     "JOIN customers c ON o.customer_id = c.customer_id " +
                     "ORDER BY b.created_at DESC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) list.add(map(rs));
        }
        return list;
    }

    public Bill getByOrderId(int orderId) throws SQLException {
        String sql = "SELECT b.*, c.name AS customer_name, o.event_type, o.event_date " +
                     "FROM bills b " +
                     "JOIN orders o ON b.order_id = o.order_id " +
                     "JOIN customers c ON o.customer_id = c.customer_id " +
                     "WHERE b.order_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, orderId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return map(rs);
            }
        }
        return null;
    }

    /** Auto-generates a bill from an order's items. */
    public int generateBill(int orderId, double discount) throws SQLException {
        // Get customer_id
        int customerId = 0;
        String selectCustSql = "SELECT customer_id FROM orders WHERE order_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(selectCustSql)) {
            ps.setInt(1, orderId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) customerId = rs.getInt("customer_id");
            }
        }

        // Calculate subtotal from order_items
        String calcSql = "SELECT SUM(quantity * unit_price) FROM order_items WHERE order_id = ?";
        double subtotal = 0;
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(calcSql)) {
            ps.setInt(1, orderId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) subtotal = rs.getDouble(1);
            }
        }

        double taxRate   = 8.0;
        double taxAmount = subtotal * taxRate / 100;
        double total     = subtotal + taxAmount - discount;
        if (total < 0) total = 0;

        // Deduct points if discount is used (1 point = 10 LKR discount)
        if (discount > 0 && customerId > 0) {
            int pointsToDeduct = (int) (discount / 10);
            if (pointsToDeduct > 0) {
                int currentPoints = 0;
                String pointsSql = "SELECT loyalty_points FROM customers WHERE customer_id = ?";
                try (Connection conn = DBConnection.getConnection();
                     PreparedStatement ps = conn.prepareStatement(pointsSql)) {
                    ps.setInt(1, customerId);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (rs.next()) currentPoints = rs.getInt("loyalty_points");
                    }
                }
                int newPoints = Math.max(currentPoints - pointsToDeduct, 0);
                new CustomerDAO().updateLoyaltyPoints(customerId, newPoints);
            }
        }

        String insertSql = "INSERT INTO bills (order_id, subtotal, tax_rate, tax_amount, discount, total_amount) " +
                           "VALUES (?,?,?,?,?,?) " +
                           "ON DUPLICATE KEY UPDATE subtotal=VALUES(subtotal), tax_amount=VALUES(tax_amount), " +
                           "discount=VALUES(discount), total_amount=VALUES(total_amount)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(insertSql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, orderId);
            ps.setDouble(2, subtotal);
            ps.setDouble(3, taxRate);
            ps.setDouble(4, taxAmount);
            ps.setDouble(5, discount);
            ps.setDouble(6, total);
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) return keys.getInt(1);
            }
        }
        return -1;
    }

    public boolean markPaid(int orderId) throws SQLException {
        double totalAmount = 0;
        int customerId = 0;
        String fetchSql = "SELECT b.total_amount, o.customer_id FROM bills b JOIN orders o ON b.order_id = o.order_id WHERE b.order_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(fetchSql)) {
            ps.setInt(1, orderId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    totalAmount = rs.getDouble("total_amount");
                    customerId = rs.getInt("customer_id");
                }
            }
        }

        String sql = "UPDATE bills SET paid = TRUE WHERE order_id = ?";
        boolean updated = false;
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, orderId);
            updated = ps.executeUpdate() > 0;
        }

        if (updated && customerId > 0 && totalAmount > 0) {
            int earnedPoints = (int) (totalAmount / 100);
            if (earnedPoints > 0) {
                int currentPoints = 0;
                String pointsSql = "SELECT loyalty_points FROM customers WHERE customer_id = ?";
                try (Connection conn = DBConnection.getConnection();
                     PreparedStatement ps = conn.prepareStatement(pointsSql)) {
                    ps.setInt(1, customerId);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (rs.next()) {
                            currentPoints = rs.getInt("loyalty_points");
                        }
                    }
                }
                new CustomerDAO().updateLoyaltyPoints(customerId, currentPoints + earnedPoints);
            }
        }
        return updated;
    }

    private Bill map(ResultSet rs) throws SQLException {
        Bill b = new Bill();
        b.setBillId(rs.getInt("bill_id"));
        b.setOrderId(rs.getInt("order_id"));
        b.setCustomerName(rs.getString("customer_name"));
        b.setEventType(rs.getString("event_type"));
        b.setEventDate(rs.getString("event_date"));
        b.setSubtotal(rs.getDouble("subtotal"));
        b.setTaxRate(rs.getDouble("tax_rate"));
        b.setTaxAmount(rs.getDouble("tax_amount"));
        b.setDiscount(rs.getDouble("discount"));
        b.setTotalAmount(rs.getDouble("total_amount"));
        b.setPaid(rs.getBoolean("paid"));
        b.setCreatedAt(rs.getString("created_at"));
        return b;
    }
}
