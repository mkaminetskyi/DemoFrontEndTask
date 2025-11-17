package com.demo.demotaskforfeside.controller;

import com.demo.demotaskforfeside.service.ExcelToHtmlService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.io.InputStream;

@Slf4j
@Controller
public class AccountsOverdueDebtsController {
    private final ExcelToHtmlService excelToHtmlService;

    public AccountsOverdueDebtsController(com.demo.demotaskforfeside.service.ExcelToHtmlService excelToHtmlService) {
        this.excelToHtmlService = excelToHtmlService;
    }

    @GetMapping(value = "/overdue-debts")
    public String overdueDebtsPage() {
        return "overdue-debts";
    }

    @GetMapping(value = "/overdue-debts-web")
    public String overdueDebtsWebPage() {
        return "overdue-debts-web";
    }


    @GetMapping(value = "/overdue-debts/data", produces = "text/html; charset=UTF-8")
    public String getOverdueDebtsFragment(Model model,
                                          @RequestParam(value = "contractor", required = false) String contractor) throws Exception {

        ClassPathResource excelResource = new ClassPathResource("Test.xlsx");
        byte[] excelData;
        try (InputStream inputStream = excelResource.getInputStream()) {
            excelData = inputStream.readAllBytes();
        }

        model.addAttribute("tableRows", excelToHtmlService.convertExcelToTableData(excelData));

        return "fragments/excel-table :: table";
    }
}
