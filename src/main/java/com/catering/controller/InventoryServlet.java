package com.catering.controller;

import com.catering.dao.InventoryDAO;
import com.catering.model.InventoryItem;
import com.google.gson.Gson;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.*;
import java.util.List;

@WebServlet("/api/inventory/*")
public class InventoryServlet extends HttpServlet {

    private final InventoryDAO dao  = new InventoryDAO();
    private final Gson         gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws IOException {
        res.setContentType("application/json;charset=UTF-8");
        try {
            String pathInfo = req.getPathInfo();
            if (pathInfo == null || pathInfo.equals("/")) {
                List<InventoryItem> list = dao.getAll();
                res.getWriter().write(gson.toJson(list));
            } else {
                int id = Integer.parseInt(pathInfo.substring(1));
                InventoryItem item = dao.getById(id);
                if (item != null) res.getWriter().write(gson.toJson(item));
                else              res.sendError(404, "Inventory item not found");
            }
        } catch (Exception e) {
            res.sendError(500, e.getMessage());
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse res) throws IOException {
        res.setContentType("application/json;charset=UTF-8");
        try {
            InventoryItem item = gson.fromJson(req.getReader(), InventoryItem.class);
            int newId = dao.create(item);
            res.setStatus(201);
            res.getWriter().write("{\"id\":" + newId + "}");
        } catch (Exception e) {
            res.sendError(500, e.getMessage());
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse res) throws IOException {
        res.setContentType("application/json;charset=UTF-8");
        try {
            InventoryItem item = gson.fromJson(req.getReader(), InventoryItem.class);
            boolean ok = dao.update(item);
            res.getWriter().write("{\"success\":" + ok + "}");
        } catch (Exception e) {
            res.sendError(500, e.getMessage());
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse res) throws IOException {
        res.setContentType("application/json;charset=UTF-8");
        try {
            String pathInfo = req.getPathInfo();
            int id = Integer.parseInt(pathInfo.substring(1));
            boolean ok = dao.delete(id);
            res.getWriter().write("{\"success\":" + ok + "}");
        } catch (Exception e) {
            res.sendError(500, e.getMessage());
        }
    }
}
