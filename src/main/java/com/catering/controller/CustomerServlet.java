package com.catering.controller;

import com.catering.dao.CustomerDAO;
import com.catering.model.Customer;
import com.google.gson.Gson;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.*;
import java.io.*;
import java.util.List;

@WebServlet("/api/customers/*")
public class CustomerServlet extends HttpServlet {

    private final CustomerDAO dao  = new CustomerDAO();
    private final Gson        gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws IOException {
        res.setContentType("application/json;charset=UTF-8");
        try {
            String pathInfo = req.getPathInfo();
            if (pathInfo == null || pathInfo.equals("/")) {
                List<Customer> list = dao.getAllCustomers();
                res.getWriter().write(gson.toJson(list));
            } else {
                int id = Integer.parseInt(pathInfo.substring(1));
                Customer c = dao.getById(id);
                if (c != null) res.getWriter().write(gson.toJson(c));
                else           res.sendError(404, "Customer not found");
            }
        } catch (Exception e) {
            res.sendError(500, e.getMessage());
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse res) throws IOException {
        res.setContentType("application/json;charset=UTF-8");
        try {
            Customer c = gson.fromJson(req.getReader(), Customer.class);
            int newId  = dao.create(c);
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
            Customer c = gson.fromJson(req.getReader(), Customer.class);
            boolean ok = dao.update(c);
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
