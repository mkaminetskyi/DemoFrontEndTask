package com.demo.demotaskforfeside.controller;

import com.demo.demotaskforfeside.service.ExcelToHtmlService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Slf4j
@Controller
@RequestMapping("/api/accounts-with-clients/overdue-debts")
public class AccountsOverdueDebtsController {
    private final ExcelToHtmlService excelToHtmlService;

    public AccountsOverdueDebtsController(com.demo.demotaskforfeside.service.ExcelToHtmlService excelToHtmlService) {
        this.excelToHtmlService = excelToHtmlService;
    }

    @GetMapping
    public String overdueDebtsPage() {
        return "mobile/accounts/overdue-debts";
    }

    @GetMapping(value = "/data", produces = "text/html; charset=UTF-8")
    public String getOverdueDebtsFragment(Model model,
                                          @RequestParam(value = "contractor", required = false) String contractor) throws Exception {

        model.addAttribute("tableRows", excelToHtmlService.convertExcelToTableData(""));

        return "mobile/fragments/excel-table :: table";
    }
}
