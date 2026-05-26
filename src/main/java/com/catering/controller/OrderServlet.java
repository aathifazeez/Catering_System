package com.catering.controller;

import com.catering.dao.OrderDAO;
import com.catering.model.Order;
import com.google.gson.Gson;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.*;
import java.io.*;
import java.util.List;

@WebServlet("/api/orders/*")
public class OrderServlet extends HttpServlet {

    private final OrderDAO dao  = new OrderDAO();
    private final Gson     gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws IOException {
        res.setContentType("application/json;charset=UTF-8");
        try {
            String pathInfo = req.getPathInfo();
            if (pathInfo == null || pathInfo.equals("/")) {
                // Dashboard stats endpoint
                if ("stats".equals(req.getParameter("type"))) {
                    String stats = String.format(
                        "{\"totalOrders\":%d,\"totalCustomers\":%d,\"revenue\":%.2f,\"pending\":%d}",
                        dao.getTotalOrders(), dao.getTotalCustomers(),
                        dao.getTotalRevenue(), dao.getPendingOrders()
                    );
                    res.getWriter().write(stats);
                } else {
                    List<Order> list = dao.getAll();
                    res.getWriter().write(gson.toJson(list));
                }
            } else {
                int id    = Integer.parseInt(pathInfo.substring(1));
                Order o   = dao.getById(id);
                if (o != null) res.getWriter().write(gson.toJson(o));
                else           res.sendError(404, "Order not found");
            }
        } catch (Exception e) {
            res.sendError(500, e.getMessage());
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse res) throws IOException {
        res.setContentType("application/json;charset=UTF-8");
        try {
            Order order = gson.fromJson(req.getReader(), Order.class);
            int newId   = dao.create(order);
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
            String pathInfo = req.getPathInfo();
            int id = Integer.parseInt(pathInfo.substring(1));
            // Expecting {"status":"Confirmed"} body
            Order body = gson.fromJson(req.getReader(), Order.class);
            boolean ok = dao.updateStatus(id, body.getStatus());
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
