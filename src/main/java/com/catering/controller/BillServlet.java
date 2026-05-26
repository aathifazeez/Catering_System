package com.catering.controller;

import com.catering.dao.BillDAO;
import com.catering.model.Bill;
import com.google.gson.Gson;
import com.google.gson.JsonObject;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.*;
import java.io.*;
import java.util.List;

@WebServlet("/api/bills/*")
public class BillServlet extends HttpServlet {

    private final BillDAO dao  = new BillDAO();
    private final Gson    gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws IOException {
        res.setContentType("application/json;charset=UTF-8");
        try {
            String pathInfo = req.getPathInfo();
            if (pathInfo == null || pathInfo.equals("/")) {
                List<Bill> list = dao.getAll();
                res.getWriter().write(gson.toJson(list));
            } else {
                // /api/bills/order/{orderId}
                String[] parts = pathInfo.split("/");
                int orderId    = Integer.parseInt(parts[parts.length - 1]);
                Bill bill      = dao.getByOrderId(orderId);
                if (bill != null) res.getWriter().write(gson.toJson(bill));
                else              res.sendError(404, "Bill not found");
            }
        } catch (Exception e) {
            res.sendError(500, e.getMessage());
        }
    }

    /** POST /api/bills  body: { "orderId": 1, "discount": 50.0 } */
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse res) throws IOException {
        res.setContentType("application/json;charset=UTF-8");
        try {
            JsonObject body    = gson.fromJson(req.getReader(), JsonObject.class);
            int orderId        = body.get("orderId").getAsInt();
            double discount    = body.has("discount") ? body.get("discount").getAsDouble() : 0.0;
            int billId         = dao.generateBill(orderId, discount);
            res.setStatus(201);
            res.getWriter().write("{\"billId\":" + billId + "}");
        } catch (Exception e) {
            res.sendError(500, e.getMessage());
        }
    }

    /** PUT /api/bills/{orderId}/pay */
    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse res) throws IOException {
        res.setContentType("application/json;charset=UTF-8");
        try {
            String pathInfo = req.getPathInfo();           // /{orderId}/pay
            String[] parts  = pathInfo.split("/");
            int orderId     = Integer.parseInt(parts[1]);
            boolean ok      = dao.markPaid(orderId);
            res.getWriter().write("{\"success\":" + ok + "}");
        } catch (Exception e) {
            res.sendError(500, e.getMessage());
        }
    }
}
