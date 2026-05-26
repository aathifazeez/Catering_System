package com.catering.dao;

import com.catering.model.MenuItem;
import com.catering.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class MenuItemDAO {

    public List<MenuItem> getAll() throws SQLException {
        List<MenuItem> list = new ArrayList<>();

        String sql = "SELECT * FROM menu_items " +
                "ORDER BY category, name";

        try (
                Connection conn = DBConnection.getConnection();
                PreparedStatement ps = conn.prepareStatement(sql);
                ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                list.add(map(rs));
            }
        }

        return list;
    }

    public List<MenuItem> getAvailable() throws SQLException {

        List<MenuItem> list = new ArrayList<>();

        String sql = "SELECT * FROM menu_items " +
                "WHERE available = TRUE " +
                "ORDER BY category, name";

        try (
                Connection conn = DBConnection.getConnection();
                PreparedStatement ps = conn.prepareStatement(sql);
                ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                list.add(map(rs));
            }
        }

        return list;
    }

    public MenuItem getById(int id) throws SQLException {

        String sql = "SELECT * FROM menu_items " +
                "WHERE item_id = ?";

        try (
                Connection conn = DBConnection.getConnection();
                PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, id);

            try (ResultSet rs = ps.executeQuery()) {

                if (rs.next()) {
                    return map(rs);
                }
            }
        }

        return null;
    }

    // CREATE MENU ITEM
    public int create(MenuItem item) throws SQLException {

        String sql = "INSERT INTO menu_items " +
                "(name, category, price, description, available, image_url) " +
                "VALUES (?, ?, ?, ?, ?, ?)";

        try (
                Connection conn = DBConnection.getConnection();

                PreparedStatement ps = conn.prepareStatement(
                        sql,
                        Statement.RETURN_GENERATED_KEYS)) {

            ps.setString(1, item.getName());
            ps.setString(2, item.getCategory());
            ps.setDouble(3, item.getPrice());
            ps.setString(4, item.getDescription());
            ps.setBoolean(5, item.isAvailable());
            ps.setString(6, item.getImageUrl());

            ps.executeUpdate();

            try (ResultSet keys = ps.getGeneratedKeys()) {

                if (keys.next()) {
                    return keys.getInt(1);
                }
            }
        }

        return -1;
    }

    // UPDATE MENU ITEM
    public boolean update(MenuItem item)
            throws SQLException {

        String sql = "UPDATE menu_items " +
                "SET name=?, " +
                "category=?, " +
                "price=?, " +
                "description=?, " +
                "available=?, " +
                "image_url=? " +
                "WHERE item_id=?";

        try (
                Connection conn = DBConnection.getConnection();

                PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, item.getName());
            ps.setString(2, item.getCategory());
            ps.setDouble(3, item.getPrice());
            ps.setString(4, item.getDescription());
            ps.setBoolean(5, item.isAvailable());
            ps.setString(6, item.getImageUrl());
            ps.setInt(7, item.getItemId());

            return ps.executeUpdate() > 0;
        }
    }

    // DELETE MENU ITEM
    public boolean delete(int id)
            throws SQLException {

        String sql = "DELETE FROM menu_items " +
                "WHERE item_id = ?";

        try (
                Connection conn = DBConnection.getConnection();

                PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, id);

            return ps.executeUpdate() > 0;
        }
    }

    // MAP DATABASE ROW → MENU ITEM OBJECT
    private MenuItem map(ResultSet rs)
            throws SQLException {

        return new MenuItem(
                rs.getInt("item_id"),
                rs.getString("name"),
                rs.getString("category"),
                rs.getDouble("price"),
                rs.getString("description"),
                rs.getBoolean("available"),
                rs.getString("image_url"));
    }
}