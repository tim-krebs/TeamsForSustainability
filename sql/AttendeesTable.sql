SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Attendees](
	[SavedEmission] [int] NULL,
	[Location] [nvarchar](255) NULL,
	[PositionLon] [float] NULL,
	[PositionLat] [float] NULL,
	[UserID] [nvarchar](255) NOT NULL,
	[Username] [nvarchar](255) NOT NULL,
	[TravelType] [nvarchar](255) NULL,
	[OnlineMeetingID] [nvarchar](255) NOT NULL,
	[Distance] [int] NULL,
	[ID] [int] IDENTITY(1,1) NOT NULL,
	[StartTime] [datetime] NOT NULL
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[Attendees] ADD  CONSTRAINT [PK_Attendees] PRIMARY KEY CLUSTERED 
(
	[ID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
