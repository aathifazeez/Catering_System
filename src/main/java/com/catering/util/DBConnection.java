package com.catering.util;

import java.io.IOException;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;

/**
 * Database connection utility.
 * Credentials are loaded from src/main/resources/db.properties at runtime.
 * Copy db.properties.template → db.properties and fill in your MySQL details.
 */
public class DBConnection {

    private static final String DB_URL;
    private static final String DB_USER;
    private static final String DB_PASS;

    static {
        // Load driver
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            throw new RuntimeException("MySQL JDBC Driver not found", e);
        }

        // Load credentials from db.properties
        Properties props = new Properties();
        try (InputStream in = DBConnection.class
                .getClassLoader()
                .getResourceAsStream("db.properties")) {
            if (in == null) {
                throw new RuntimeException(
                    "db.properties not found in classpath. " +
                    "Copy src/main/resources/db.properties.template to " +
                    "src/main/resources/db.properties and set your credentials.");
            }
            props.load(in);
        } catch (IOException e) {
            throw new RuntimeException("Failed to load db.properties", e);
        }

        DB_URL  = props.getProperty("db.url");
        DB_USER = props.getProperty("db.user");
        DB_PASS = props.getProperty("db.password");
    }

    /** Returns a new connection from DriverManager. Caller must close it. */
    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
    }
}
