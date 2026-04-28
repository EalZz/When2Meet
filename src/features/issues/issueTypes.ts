export type IssueType = "bug" | "improvement" | "feature";
export type IssueStatus = "open" | "reviewing" | "resolved" | "closed";

export type CreateIssueInput = {
  userId: string;
  roomId?: string | null;
  issueType: IssueType;
  title: string;
  body: string;
};

export type UserIssue = CreateIssueInput & {
  id: string;
  status: IssueStatus;
  createdAt: string;
};
