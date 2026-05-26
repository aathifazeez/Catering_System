package com.catering.controller;

import com.catering.dao.MenuItemDAO;
import com.catering.model.MenuItem;
import com.google.gson.Gson;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.*;
import java.io.*;
import java.util.List;

@WebServlet("/api/menu/*")
public class MenuItemServlet extends HttpServlet {

    private final MenuItemDAO dao  = new MenuItemDAO();
    private final Gson        gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws IOException {
        res.setContentType("application/json;charset=UTF-8");
        try {
            String pathInfo = req.getPathInfo();
            if (pathInfo == null || pathInfo.equals("/")) {
                String avail = req.getParameter("available");
                List<MenuItem> list = "true".equals(avail) ? dao.getAvailable() : dao.getAll();
                res.getWriter().write(gson.toJson(list));
            } else {
                int id = Integer.parseInt(pathInfo.substring(1));
                MenuItem item = dao.getById(id);
                if (item != null) res.getWriter().write(gson.toJson(item));
                else              res.sendError(404, "Item not found");
            }
        } catch (Exception e) {
            res.sendError(500, e.getMessage());
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse res) throws IOException {
        res.setContentType("application/json;charset=UTF-8");
        try {
            MenuItem item = gson.fromJson(req.getReader(), MenuItem.class);
            int newId     = dao.create(item);
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
            MenuItem item = gson.fromJson(req.getReader(), MenuItem.class);
            boolean ok    = dao.update(item);
            res.getWriter().write("{\"success\":" + ok + "}");
        } catch (Exception e) {
            res.sendError(500, e.getMessage());
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse res) throws IOException {
        res.setContentType("application/json;charset=UTF-8");
        try {
            int id     = Integer.parseInt(req.getPathInfo().substring(1));
            boolean ok = dao.delete(id);
            res.getWriter().write("{\"success\":" + ok + "}");
        } catch (Exception e) {
            res.sendError(500, e.getMessage());
        }
    }
}
